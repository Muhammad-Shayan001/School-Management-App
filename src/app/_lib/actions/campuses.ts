'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Get all campuses the current admin has access to.
 */
export async function getAdminCampuses() {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Unauthorized' };

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { data: [], error: 'Profile not found' };

  // Super admins can see all campuses
  if (profile.role === 'super_admin') {
    const { data, error } = await adminClient
      .from('schools')
      .select('id, name, logo_url, theme_color, campus_type, campus_code, is_active, phone, email, address, principal_name, description, banner_url, campus_timing, parent_school_id')
      .order('name');
    return { data: data || [], error: error?.message || null };
  }

  // Fetch all campuses that belong to this specific Principal/Admin
  // Filter logic: Only schools where the current user is the admin_id OR it's a child of their primary school
  const { data, error } = await adminClient
    .from('schools')
    .select('id, name, logo_url, theme_color, campus_type, campus_code, is_active, phone, email, address, principal_name, description, banner_url, campus_timing, parent_school_id')
    .or(`admin_id.eq.${user.id},parent_school_id.eq.${profile.school_id}`)
    .order('name');

  return { data: data || [], error: error?.message || null };
}

/**
 * Helper to process FormData or plain objects and upload logo file if present.
 */
async function processCampusFormData(formDataRaw: any) {
  const adminClient = createAdminClient();
  let name, campus_code, address, phone, email, principal_name, description, banner_url, campus_type, campus_timing, theme_color, is_active;
  let logo_url = null;
  let logoFile: File | null = null;

  if (typeof formDataRaw?.get === 'function') {
    name = formDataRaw.get('name') as string;
    campus_code = formDataRaw.get('campus_code') as string;
    address = formDataRaw.get('address') as string;
    phone = formDataRaw.get('phone') as string;
    email = formDataRaw.get('email') as string;
    principal_name = formDataRaw.get('principal_name') as string;
    description = formDataRaw.get('description') as string;
    banner_url = formDataRaw.get('banner_url') as string;
    logo_url = formDataRaw.get('logo_url') as string || null;
    campus_type = formDataRaw.get('campus_type') as string;
    campus_timing = formDataRaw.get('campus_timing') as string;
    theme_color = formDataRaw.get('theme_color') as string || '#6366f1';
    is_active = formDataRaw.get('is_active') !== 'false';
    logoFile = formDataRaw.get('logo_file') as File | null;
  } else {
    name = formDataRaw.name;
    campus_code = formDataRaw.campus_code;
    address = formDataRaw.address;
    phone = formDataRaw.phone;
    email = formDataRaw.email;
    principal_name = formDataRaw.principal_name;
    description = formDataRaw.description;
    banner_url = formDataRaw.banner_url;
    logo_url = formDataRaw.logo_url || null;
    campus_type = formDataRaw.campus_type;
    campus_timing = formDataRaw.campus_timing;
    theme_color = formDataRaw.theme_color || '#6366f1';
    is_active = formDataRaw.is_active !== false;
  }

  if (logoFile && logoFile.size > 0) {
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `campus-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = `school-logos/${fileName}`;

    const { error: uploadError } = await adminClient
      .storage
      .from('profiles')
      .upload(filePath, logoFile, { contentType: logoFile.type, upsert: true });

    if (!uploadError) {
      const { data: publicUrlData } = adminClient.storage.from('profiles').getPublicUrl(filePath);
      logo_url = publicUrlData.publicUrl;
    }
  }

  return { name, campus_code, address, phone, email, principal_name, description, banner_url, logo_url, campus_type, campus_timing, theme_color, is_active };
}

/**
 * Create a new campus under the admin's institution.
 */
export async function createCampus(formDataRaw: any) {
  console.log('[createCampus] Server action started');
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('[createCampus] Auth error:', authError);
    return { error: 'Unauthorized: Please log in again.' };
  }

  console.log('[createCampus] Fetching profile for user:', user.id);
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('[createCampus] Profile fetch error:', profileError);
    return { error: 'Could not verify your permissions.' };
  }

  if (!['admin', 'super_admin'].includes(profile.role)) {
    console.warn('[createCampus] Unauthorized role attempt:', profile.role);
    return { error: 'Unauthorized: Only admins can create campuses.' };
  }

  const { name, campus_code, address, phone, email, principal_name, description, banner_url, logo_url, campus_type, campus_timing, theme_color } = await processCampusFormData(formDataRaw);
  
  if (!name) return { error: 'Campus name is required.' };

  // Generate a unique internal code/slug
  const baseSlug = (campus_code || name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const uniqueCode = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

  console.log('[createCampus] Creating school record:', name, 'with code:', uniqueCode);
  
  // Create the campus as a new school entry
  const { data: campus, error: createError } = await adminClient
    .from('schools')
    .insert({
      name,
      code: uniqueCode, // This must be unique globally
      address: address || null,
      phone: phone || null,
      email: email || null,
      principal_name: principal_name || null,
      logo_url: logo_url || null,
      banner_url: banner_url || null,
      description: description || null,
      campus_code: campus_code || baseSlug.toUpperCase(), // This is the display code
      campus_type: campus_type || 'branch',
      campus_timing: campus_timing || null,
      theme_color: theme_color || '#6366f1',
      is_active: true,
      parent_school_id: profile.school_id || null,
      admin_id: user.id,
    })
    .select()
    .single();

  if (createError) {
    console.error('[createCampus] School creation failed:', createError);
    if (createError.code === '23505') return { error: 'Campus code or URL slug already exists.' };
    return { error: 'Failed to create campus: ' + createError.message };
  }

  console.log('[createCampus] Linking admin to new campus:', campus.id);
  // Link admin to this new campus
  const { error: linkError } = await adminClient.from('admin_campuses').insert({
    admin_id: user.id,
    school_id: campus.id,
    is_primary: false,
  });

  if (linkError) {
    console.error('[createCampus] Admin link failed:', linkError);
    // We don't return here because the school is already created, but it's a problem
  }

  console.log('[createCampus] Seeding classes for campus...');
  // Seed default classes (Class 1-12) for the new campus
  const { CLASS_NAMES } = await import('@/app/_lib/utils/constants');
  const classInserts = CLASS_NAMES.map(cn => ({
    name: cn,
    school_id: campus.id,
    section: 'A',
  }));
  const { error: classError } = await adminClient.from('classes').insert(classInserts);

  if (classError) {
    console.error('[createCampus] Class seeding failed:', classError);
  }

  console.log('[createCampus] Success!');
  revalidatePath('/admin/campuses');
  return { success: true, campus };
}

/**
 * Update an existing campus.
 */
export async function updateCampus(campusId: string, formDataRaw: any) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Verify admin has access to this campus
  const { data: link } = await adminClient
    .from('admin_campuses')
    .select('id')
    .eq('admin_id', user.id)
    .eq('school_id', campusId)
    .single();

  // Also allow if admin's primary school_id matches
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!link && profile?.school_id !== campusId && profile?.role !== 'super_admin') {
    return { error: 'Unauthorized: You do not have access to this campus.' };
  }

  const { name, campus_code, address, phone, email, principal_name, description, banner_url, logo_url, campus_type, campus_timing, theme_color, is_active } = await processCampusFormData(formDataRaw);

  const { error } = await adminClient
    .from('schools')
    .update({
      name,
      address: address || null,
      phone: phone || null,
      email: email || null,
      principal_name: principal_name || null,
      logo_url: logo_url || null,
      banner_url: banner_url || null,
      description: description || null,
      campus_code: campus_code || null,
      campus_type: campus_type || null,
      campus_timing: campus_timing || null,
      theme_color: theme_color || '#6366f1',
      is_active,
    })
    .eq('id', campusId);

  if (error) return { error: error.message };

  revalidatePath('/admin/campuses');
  return { success: true };
}

/**
 * Delete a campus (only if it's not the primary/last campus).
 */
export async function deleteCampus(campusId: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  // Cannot delete the primary school
  if (profile?.school_id === campusId) {
    return { error: 'Cannot delete your primary campus. Please set a different primary campus first.' };
  }

  // Check that admin has access
  const { data: link } = await adminClient
    .from('admin_campuses')
    .select('id')
    .eq('admin_id', user.id)
    .eq('school_id', campusId)
    .single();

  if (!link && profile?.role !== 'super_admin') {
    return { error: 'Unauthorized' };
  }

  // Remove the junction record
  await adminClient
    .from('admin_campuses')
    .delete()
    .eq('school_id', campusId);

  // Delete the school
  const { error } = await adminClient
    .from('schools')
    .delete()
    .eq('id', campusId);

  if (error) return { error: error.message };

  revalidatePath('/admin/campuses');
  return { success: true };
}

/**
 * Toggle campus active status.
 */
export async function toggleCampusStatus(campusId: string, isActive: boolean) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('schools')
    .update({ is_active: isActive })
    .eq('id', campusId);

  if (error) return { error: error.message };

  revalidatePath('/admin/campuses');
  return { success: true };
}

/**
 * Get campus statistics (student/teacher counts, etc).
 */
export async function getCampusStats(schoolId: string) {
  const adminClient = createAdminClient();

  const [
    { count: totalStudents },
    { count: totalTeachers },
    { count: totalClasses },
  ] = await Promise.all([
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'student').eq('status', 'approved'),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'teacher').eq('status', 'approved'),
    adminClient.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
  ]);

  return {
    totalStudents: totalStudents || 0,
    totalTeachers: totalTeachers || 0,
    totalClasses: totalClasses || 0,
  };
}

/**
 * Switch active campus context by updating profile.school_id
 */
export async function setActiveCampusContext(campusId: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: caller } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!caller || !['super_admin', 'admin'].includes(caller.role)) {
    return { error: 'Unauthorized' };
  }

  // Verify they have access to this campus
  if (caller.role !== 'super_admin') {
    const { data: link } = await adminClient
      .from('admin_campuses')
      .select('id')
      .eq('admin_id', user.id)
      .eq('school_id', campusId)
      .single();

    if (!link) {
      // Also check if it's their current primary school_id
      const { data: currentProfile } = await adminClient
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();
      if (currentProfile?.school_id !== campusId) {
        return { error: 'Unauthorized: You do not have access to this campus.' };
      }
    }
  }

  // Update profile
  const { error } = await adminClient
    .from('profiles')
    .update({ school_id: campusId })
    .eq('id', user.id);

  if (error) return { error: error.message };

  return { success: true };
}
