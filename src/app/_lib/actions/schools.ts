'use server';

import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath, unstable_cache } from 'next/cache';

/**
 * Get all schools.
 */
export async function getSchools() {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('schools')
    .select('*, admin:profiles(id, full_name, email, status)')
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Create a new school from the detailed 'Add School' page.
 */
export async function createNewSchool(formData: FormData) {
  const adminClient = createAdminClient();

  // Basic Info
  const name = formData.get('name') as string;
  const short_name = formData.get('short_name') as string;
  const code = (formData.get('campus_code') as string) || `SCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const school_type = formData.get('school_type') as string;
  const education_board = formData.get('education_board') as string;
  const established_year = formData.get('established_year') ? parseInt(formData.get('established_year') as string) : null;
  const registration_number = formData.get('registration_number') as string;
  const ntn_number = formData.get('ntn_number') as string;
  const school_motto = formData.get('school_motto') as string;
  const description = formData.get('description') as string;

  // Branding
  const primary_color = formData.get('primary_color') as string;
  const secondary_color = formData.get('secondary_color') as string;
  const accent_color = formData.get('accent_color') as string;
  let logo_url = formData.get('logo_url') as string | null;
  const banner_url = formData.get('banner_url') as string;

  // Contact & Location
  const country = formData.get('country') as string;
  const province = formData.get('province') as string;
  const city = formData.get('city') as string;
  const area = formData.get('area') as string;
  const postal_code = formData.get('postal_code') as string;
  const map_url = formData.get('map_url') as string;
  const address = formData.get('address') as string;

  const phone = formData.get('phone') as string;
  const whatsapp_number = formData.get('whatsapp_number') as string;
  const email = formData.get('email') as string;
  const website_url = formData.get('website_url') as string;
  const facebook_url = formData.get('facebook_url') as string;
  const instagram_url = formData.get('instagram_url') as string;
  const youtube_url = formData.get('youtube_url') as string;

  // Admin Info
  const admin_name = formData.get('admin_name') as string;
  const admin_email = formData.get('admin_email') as string;
  const admin_password = formData.get('admin_password') as string;
  const admin_cnic = formData.get('admin_cnic') as string;
  const admin_phone = formData.get('admin_phone') as string;
  const admin_gender = formData.get('admin_gender') as string;

  // Settings JSON
  const settings = {
    academic_year: formData.get('academic_year') as string,
    result_system_type: formData.get('result_system_type') as string,
    passing_percentage: parseInt(formData.get('passing_percentage') as string) || 40,
    qr_attendance_enabled: formData.get('qr_attendance') === 'on',
    late_time_limit: formData.get('late_time_limit') as string,
    auto_absent_time: formData.get('auto_absent_time') as string,
    currency: formData.get('currency') as string,
    monthly_fee: parseInt(formData.get('monthly_fee') as string) || 0,
    period_duration: parseInt(formData.get('period_duration') as string) || 45,
  };

  if (!name || !admin_email || !admin_password) {
    return { error: 'Missing required fields (Name, Admin Email, Admin Password).' };
  }

  // Handle Logo Upload
  const logoFile = formData.get('logo_file') as File;
  if (logoFile && logoFile.size > 0) {
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${code}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `school-logos/${fileName}`;

    const { data: uploadData, error: uploadError } = await adminClient
      .storage
      .from('profiles')
      .upload(filePath, logoFile, { contentType: logoFile.type, upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = adminClient.storage.from('profiles').getPublicUrl(filePath);
      logo_url = publicUrl;
    }
  }

  // Insert School
  const { data: school, error: schoolError } = await adminClient
    .from('schools')
    .insert({
      name, short_name: short_name || null, code, school_type: school_type || null,
      education_board: education_board || null, established_year, registration_number: registration_number || null,
      ntn_number: ntn_number || null, school_motto: school_motto || null, description: description || null,
      primary_color: primary_color || null, secondary_color: secondary_color || null, accent_color: accent_color || null,
      logo_url, banner_url: banner_url || null, country: country || null, province: province || null,
      city: city || null, area: area || null, postal_code: postal_code || null, map_url: map_url || null, address: address || null,
      phone: phone || null, whatsapp_number: whatsapp_number || null, email: email || null, website_url: website_url || null,
      facebook_url: facebook_url || null, instagram_url: instagram_url || null, youtube_url: youtube_url || null,
      settings: settings, principal_name: admin_name
    })
    .select()
    .single();

  if (schoolError) {
    console.error('SCHOOL INSERT ERROR:', schoolError);
    if (schoolError.code === '23505') {
      return { error: 'This School Code is already taken. Please use a unique code (e.g. 05, 06).' };
    }
    return { error: schoolError.message };
  }

  // Create Admin User
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: admin_email,
    password: admin_password,
    email_confirm: true,
    user_metadata: { full_name: admin_name, role: 'admin', status: 'approved' },
  });

  if (authError) {
    console.error('AUTH ADMIN CREATE USER ERROR:', authError);
    await adminClient.from('schools').delete().eq('id', school.id);
    return { error: 'Failed to create Admin account: ' + authError.message };
  }

  // Create Profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: authData.user.id, email: admin_email, full_name: admin_name,
    phone: admin_phone || null, role: 'admin', status: 'approved', school_id: school.id,
  });

  if (profileError) {
    console.error('PROFILE INSERT ERROR:', profileError);
    return { error: 'School created but Admin profile failed: ' + profileError.message };
  }

  // Also update schools with admin_id
  await adminClient.from('schools').update({ admin_id: authData.user.id }).eq('id', school.id);

  // Link to admin_campuses
  await adminClient.from('admin_campuses').insert({
    admin_id: authData.user.id,
    school_id: school.id,
    is_primary: true
  });

  revalidatePath('/super-admin/schools');
  return { data: school, error: null };
}

/**
 * Create a new school.
 */
export async function createSchool(formData: FormData) {
  const adminClient = createAdminClient();

  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const country = formData.get('country') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const website = formData.get('website') as string;
  const principalName = formData.get('admin_name') as string;
  
  // Admin credentials
  const adminEmail = formData.get('admin_email') as string;
  const adminPassword = formData.get('admin_password') as string;

  if (!name) return { error: 'School name is required.' };
  if (!code) return { error: 'School code is required.' };
  if (!adminEmail || !adminPassword) return { error: 'Administrator credentials (email & password) are required.' };

  // 1. Handle Logo Upload if present
  let logoUrl = null;
  const logoFile = formData.get('logo') as File;
  
  if (logoFile && logoFile.size > 0) {
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${code}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `school-logos/${fileName}`;

    const { data: uploadData, error: uploadError } = await adminClient
      .storage
      .from('profiles')
      .upload(filePath, logoFile, {
        contentType: logoFile.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Logo upload error:', uploadError);
    } else {
      const { data: { publicUrl } } = adminClient
        .storage
        .from('profiles')
        .getPublicUrl(filePath);
      logoUrl = publicUrl;
    }
  } else {
    // Fallback to text input if no file but URL provided
    logoUrl = formData.get('logo_url') as string || null;
  }

  // 2. Create School
  const { data: school, error: schoolError } = await adminClient
    .from('schools')
    .insert({
      name,
      code,
      address: address || null,
      city: city || null,
      country: country || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      principal_name: principalName || null,
      logo_url: logoUrl,
    })
    .select()
    .single();

  if (schoolError) {
    if (schoolError.code === '23505') return { error: 'School code already exists.' };
    return { error: schoolError.message };
  }

  // 2. Create Admin User
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: principalName || 'School Admin',
      role: 'admin',
      status: 'approved',
    },
  });

  if (authError) {
    // Cleanup school if user creation fails
    await adminClient.from('schools').delete().eq('id', school.id);
    return { error: 'Failed to create Admin account: ' + authError.message };
  }

  // 3. Create Profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: authData.user.id,
    email: adminEmail,
    full_name: principalName || 'School Admin',
    role: 'admin',
    status: 'approved',
    school_id: school.id,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    await adminClient.from('schools').delete().eq('id', school.id);
    return { error: 'School created but Admin profile failed: ' + profileError.message };
  }

  // 4. Link Admin to Campus in admin_campuses
  const { error: campusErr } = await adminClient.from('admin_campuses').insert({
    admin_id: authData.user.id,
    school_id: school.id,
    is_primary: true
  });

  if (campusErr) {
    await adminClient.from('profiles').delete().eq('id', authData.user.id);
    await adminClient.auth.admin.deleteUser(authData.user.id);
    await adminClient.from('schools').delete().eq('id', school.id);
    return { error: 'Failed to assign campus to admin: ' + campusErr.message };
  }

  revalidatePath('/super-admin/schools');
  return { error: null };
}

/**
 * Get school count.
 */
export async function getSchoolCount() {
  const adminClient = createAdminClient();
  const { count } = await adminClient.from('schools').select('*', { count: 'exact', head: true });
  return count || 0;
}

/**
 * Get basic school info for public signup page by school.
 * Wrapped in unstable_cache for high-performance public access.
 */
export const getPublicSchools = unstable_cache(
  async () => {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('schools')
      .select('id, name, logo_url')
      .order('name');
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },
  ['public-schools'],
  { revalidate: 3600, tags: ['schools'] }
);

/**
 * Get basic class info for public signup page by school.
 */
export async function getPublicClasses(schoolId: string) {
  const adminClient = createAdminClient();
  
  // Fetch existing classes
  const { data: existingClasses, error } = await adminClient
    .from('classes')
    .select('id, name, section')
    .eq('school_id', schoolId)
    .order('name');

  if (error) return { data: null, error: error.message };

  // Ensure Class 1-10 exist
  const { CLASS_NAMES } = await import('@/app/_lib/utils/constants');
  const existingNames = new Set(existingClasses?.map(c => c.name));
  const missingNames = CLASS_NAMES.filter(name => !existingNames.has(name));

  if (missingNames.length > 0) {
    const newClasses = missingNames.map(name => ({
      name,
      school_id: schoolId,
      section: 'A'
    }));
    await adminClient.from('classes').insert(newClasses);
    
    // Fetch again after seeding
    const { data: updatedClasses } = await adminClient
      .from('classes')
      .select('id, name, section')
      .eq('school_id', schoolId)
      .order('name');
    return { data: updatedClasses, error: null };
  }

  return { data: existingClasses, error: null };
}

/**
 * Get all classes for the current user's school.
 * Seeds default classes if none exist.
 */
export async function getClasses(schoolId?: string) {
  const adminClient = createAdminClient();
  const { createClient } = await import('@/app/_lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Unauthorized' };

  let finalSchoolId = schoolId;

  if (!finalSchoolId) {
    // Use admin client to fetch profile to bypass RLS
    const { data: profile } = await adminClient
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();
    finalSchoolId = profile?.school_id;
  }

  if (!finalSchoolId) return { data: [], error: 'No school found' };

  // Fetch existing classes
  const { data: existingClasses, error } = await adminClient
    .from('classes')
    .select('*')
    .eq('school_id', finalSchoolId)
    .order('name');

  if (error) return { data: [], error: error.message };

  // Ensure Class 1-10 exist
  const { CLASS_NAMES } = await import('@/app/_lib/utils/constants');
  const existingNames = new Set(existingClasses?.map(c => c.name));
  const missingNames = CLASS_NAMES.filter(name => !existingNames.has(name));

  if (missingNames.length > 0) {
    const newClasses = missingNames.map(name => ({
      name,
      school_id: finalSchoolId,
      section: 'A'
    }));
    await adminClient.from('classes').insert(newClasses);
    
    // Fetch again after seeding
    const { data: updatedClasses } = await adminClient
      .from('classes')
      .select('*')
      .eq('school_id', finalSchoolId)
      .order('name');
    
    return { data: sortClasses(updatedClasses || []) };
  }

  return { data: sortClasses(existingClasses || []) };
}

/**
 * Natural sort for classes (Class 1, Class 2... Class 10)
 */
function sortClasses(classes: any[]) {
  return classes.sort((a: any, b: any) => {
    const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return (a.section || '').localeCompare(b.section || '');
  });
}

/**
 * Get all subjects for the current user's school.
 */
export async function getSubjects() {
  const adminClient = createAdminClient();
  const { createClient } = await import('@/app/_lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) return { data: [], error: 'No school found' };

  const { data, error } = await adminClient
    .from('subjects')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('name');

  if (error) return { data: [], error: error.message };
  return { data };
}

/**
 * Get current school info for branding.
 */
export async function getSchoolInfo() {
  const adminClient = createAdminClient();
  const { createClient } = await import('@/app/_lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) return { data: null, error: 'No school found' };

  const { data, error } = await adminClient
    .from('schools')
    .select('*')
    .eq('id', profile.school_id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data };
}
