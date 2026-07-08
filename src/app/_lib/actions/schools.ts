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
  const institution_type = formData.get('institution_type') as string || 'school';
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
      name, short_name: short_name || null, code, institution_type, school_type: school_type || null,
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

function getDefaultClassSeeds(institutionType?: string): string[] {
  switch (institutionType) {
    case 'college':
      // College: only Class 11 and Class 12
      return ['Class 11', 'Class 12'];
    case 'university':
      // University: BS and MS programs
      return ['BS', 'MS'];
    case 'academy':
      // Academy: all 12 classes (so students can be enrolled in a class)
      return [
        'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
        'Class 11', 'Class 12'
      ];
    default:
      // School: Class 1 to Class 10 only
      return [
        'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
      ];
  }
}

function getDefaultCourseSeeds(institutionType?: string): string[] {
  // Courses are stored as subjects with is_course = true
  // Only auto-seed for academy
  if (institutionType === 'academy') {
    return ['Web Development', 'Graphic Design', 'Digital Marketing', 'Data Science', 'Programming Fundamentals', 'UI/UX Design'];
  }
  return [];
}

function parseCourseDetails(raw: string | null | undefined) {
  if (!raw) {
    return {
      summary: '',
      start_date: '',
      end_date: '',
      duration_weeks: '',
      days: '',
      slots: [] as string[],
      level: ''
    };
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        summary: parsed.summary || parsed.description || '',
        start_date: parsed.start_date || '',
        end_date: parsed.end_date || '',
        duration_weeks: parsed.duration_weeks || '',
        days: parsed.days || '',
        slots: Array.isArray(parsed.slots) ? parsed.slots.filter(Boolean) : [],
        level: parsed.level || ''
      };
    }
  } catch {
    // Fall back to plain text description
  }

  return {
    summary: raw,
    start_date: '',
    end_date: '',
    duration_weeks: '',
    days: '',
    slots: [],
    level: ''
  };
}

function buildCourseDescription(description: string = '', metadata: any = {}) {
  const slotList = Array.isArray(metadata.slots)
    ? metadata.slots.filter(Boolean)
    : (typeof metadata.course_slots === 'string'
      ? metadata.course_slots
          .split('\n')
          .map((item: string) => item.trim())
          .filter(Boolean)
      : []);

  return JSON.stringify({
    summary: metadata.description || description || '',
    start_date: metadata.start_date || '',
    end_date: metadata.end_date || '',
    duration_weeks: metadata.duration_weeks || '',
    days: metadata.days || '',
    slots: slotList,
    level: metadata.level || ''
  });
}

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

  // Fetch school to know institution_type
  const { data: schoolDetails } = await adminClient
    .from('schools')
    .select('institution_type')
    .eq('id', schoolId)
    .single();
    
  const type = schoolDetails?.institution_type || 'school';
  const seedNames = getDefaultClassSeeds(type);

  const existingNames = new Set(existingClasses?.map(c => c.name));
  const missingNames = seedNames.filter(name => !existingNames.has(name));

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

  // Fetch school to determine institution_type for dynamic seeding
  const { data: schoolInfo } = await adminClient
    .from('schools')
    .select('institution_type')
    .eq('id', finalSchoolId)
    .single();

  const institutionType = schoolInfo?.institution_type || 'school';
  const seedNames = getDefaultClassSeeds(institutionType);

  const existingNames = new Set(existingClasses?.map(c => c.name));
  const missingNames = seedNames.filter(name => !existingNames.has(name));

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

  const { data: existingSubjects, error } = await adminClient
    .from('subjects')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('name');

  if (error) return { data: [], error: error.message };

  const { data: schoolInfo } = await adminClient
    .from('schools')
    .select('institution_type')
    .eq('id', profile.school_id)
    .single();

  const institutionType = schoolInfo?.institution_type || 'school';
  const seedNames = getDefaultCourseSeeds(institutionType);
  const existingNames = new Set((existingSubjects || []).map((subject: any) => subject.name));
  const missingNames = seedNames.filter((name) => !existingNames.has(name));

  if (missingNames.length > 0) {
    await adminClient.from('subjects').insert(
      missingNames.map((name) => ({
        name,
        school_id: profile.school_id,
      }))
    );

    const { data: updatedSubjects, error: updateError } = await adminClient
      .from('subjects')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('name');

    if (updateError) return { data: [], error: updateError.message };
    return { data: updatedSubjects };
  }

  return { data: existingSubjects };
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

export async function deleteSchool(schoolId: string) {
  const adminClient = createAdminClient();
  const { createClient } = await import('@/app/_lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Check if caller is super_admin
  const { data: caller } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!caller || caller.role !== 'super_admin') {
    return { error: 'Unauthorized: Only super admins can delete schools.' };
  }

  try {
    // 1. Fetch all profiles associated with the school
    const { data: schoolProfiles } = await adminClient
      .from('profiles')
      .select('id')
      .eq('school_id', schoolId);

    const userIds = schoolProfiles ? schoolProfiles.map(p => p.id) : [];

    // 2. Delete all records from dependent tables sequentially to prevent foreign key errors
    await adminClient.from('attendance').delete().eq('school_id', schoolId);
    await adminClient.from('results').delete().eq('school_id', schoolId);
    await adminClient.from('assignments').delete().eq('school_id', schoolId);
    await adminClient.from('exam_schedules').delete().eq('school_id', schoolId);
    await adminClient.from('announcements').delete().eq('school_id', schoolId);

    const { data: syllabiData } = await adminClient.from('syllabi').select('id').eq('school_id', schoolId);
    const syllabusIds = syllabiData?.map(s => s.id) || [];
    if (syllabusIds.length > 0) {
      await adminClient.from('syllabus_chapters').delete().in('syllabus_id', syllabusIds);
    }
    await adminClient.from('syllabi').delete().eq('school_id', schoolId);
    await adminClient.from('teacher_assignments').delete().eq('school_id', schoolId);
    
    if (userIds.length > 0) {
      await adminClient.from('teacher_profiles').delete().in('user_id', userIds);
      await adminClient.from('student_profiles').delete().in('user_id', userIds);
      await adminClient.from('admin_campuses').delete().in('admin_id', userIds);
    }
    
    await adminClient.from('classes').delete().eq('school_id', schoolId);
    await adminClient.from('subjects').delete().eq('school_id', schoolId);
    await adminClient.from('campuses').delete().eq('school_id', schoolId);

    // Delete profiles
    if (userIds.length > 0) {
      await adminClient.from('profiles').delete().eq('school_id', schoolId);
    }

    // 3. Delete the school itself
    const { error: schoolErr } = await adminClient
      .from('schools')
      .delete()
      .eq('id', schoolId);

    if (schoolErr) {
      throw new Error(schoolErr.message);
    }

    // 4. Delete Auth users
    if (userIds.length > 0) {
      for (const uid of userIds) {
        try {
          await adminClient.auth.admin.deleteUser(uid);
        } catch (e) {
          console.error(`Failed to delete auth user ${uid}:`, e);
        }
      }
    }

    revalidatePath('/super-admin/schools');
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting school:', err);
    return { error: 'Failed to delete school: ' + err.message };
  }
}

// ─── Class Management Actions ────────────────────────────────────────────────

/**
 * Add a new class to the current admin's school.
 */
export async function addClass(name: string, section: string = 'A') {
  const adminClient = createAdminClient();
  const { createClient } = await import('@/app/_lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await adminClient
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) return { error: 'No school found' };

  // Check if class with same name+section already exists
  const { data: existing } = await adminClient
    .from('classes')
    .select('id')
    .eq('school_id', profile.school_id)
    .eq('name', name.trim())
    .eq('section', section.trim() || 'A')
    .single();

  if (existing) return { error: 'A class with this name and section already exists.' };

  const { data, error } = await adminClient
    .from('classes')
    .insert({ name: name.trim(), section: section.trim() || 'A', school_id: profile.school_id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/admin/classrooms');
  revalidatePath('/admin/students');
  return { data, error: null };
}

/**
 * Delete a class from the current admin's school.
 */
export async function deleteClass(classId: string) {
  const adminClient = createAdminClient();
  const { createClient } = await import('@/app/_lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Verify ownership
  const { data: profile } = await adminClient
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  const { data: cls } = await adminClient
    .from('classes')
    .select('school_id')
    .eq('id', classId)
    .single();

  if (!cls || cls.school_id !== profile?.school_id) {
    return { error: 'Unauthorized or class not found.' };
  }

  const { error } = await adminClient.from('classes').delete().eq('id', classId);
  if (error) return { error: error.message };

  revalidatePath('/admin/classrooms');
  revalidatePath('/admin/students');
  return { error: null };
}

/**
 * Get all courses (subjects with is_course=true) for the current school.
 * Falls back to all subjects if is_course column does not exist.
 */
export async function getCourses() {
  const adminClient = createAdminClient();
  const { createClient } = await import('@/app/_lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Unauthorized' };

  const { data: profile } = await adminClient
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) return { data: [], error: 'No school found' };

  // Try fetching with is_course filter first
  const { data, error } = await adminClient
    .from('subjects')
    .select('*')
    .eq('school_id', profile.school_id)
    .eq('is_course', true)
    .order('name');

  // If is_course column doesn't exist, fall back to all subjects
  if (error && error.message?.includes('is_course')) {
    const { data: allSubjects, error: subErr } = await adminClient
      .from('subjects')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('name');
    if (subErr) return { data: [], error: subErr.message };
    return {
      data: (allSubjects || []).map((item: any) => {
        const parsed = parseCourseDetails(item.description);
        return {
          ...item,
          description: parsed.summary || item.description || '',
          course_details: parsed
        };
      }),
      error: null
    };
  }

  if (error) return { data: [], error: error.message };
  return {
    data: (data || []).map((item: any) => {
      const parsed = parseCourseDetails(item.description);
      return {
        ...item,
        description: parsed.summary || item.description || '',
        course_details: parsed
      };
    }),
    error: null
  };
}

/**
 * Add a new course (stored as a subject with is_course=true).
 */
export async function addCourse(name: string, description: string = '', metadata: any = {}) {
  const adminClient = createAdminClient();
  const { createClient } = await import('@/app/_lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await adminClient
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) return { error: 'No school found' };

  const serializedDetails = buildCourseDescription(description, metadata);

  // Try inserting with the richer academy course payload first
  const insertPayload: any = {
    name: name.trim(),
    school_id: profile.school_id,
    description: serializedDetails,
    is_course: true,
  };

  if (metadata.start_date) insertPayload.course_start_date = metadata.start_date;
  if (metadata.end_date) insertPayload.course_end_date = metadata.end_date;
  if (metadata.duration_weeks) insertPayload.course_duration_weeks = Number(metadata.duration_weeks);
  if (metadata.days) insertPayload.course_days = metadata.days;
  if (metadata.level) insertPayload.course_level = metadata.level;

  const slotList = Array.isArray(metadata.slots)
    ? metadata.slots.filter(Boolean)
    : (typeof metadata.course_slots === 'string'
      ? metadata.course_slots
          .split('\n')
          .map((item: string) => item.trim())
          .filter(Boolean)
      : []);

  if (slotList.length) insertPayload.course_slots = slotList;

  const { data, error } = await adminClient
    .from('subjects')
    .insert(insertPayload)
    .select()
    .single();

  if (error && (error.message?.includes('is_course') || error.message?.includes('course_') || error.code === '42703')) {
    const fallbackPayload: any = {
      name: name.trim(),
      school_id: profile.school_id,
      description: serializedDetails,
    };

    if (!error.message?.includes('is_course')) {
      fallbackPayload.is_course = true;
    }

    const { data: d2, error: e2 } = await adminClient
      .from('subjects')
      .insert(fallbackPayload)
      .select()
      .single();
    if (e2) return { error: e2.message };
    revalidatePath('/admin/classrooms');
    return { data: d2, error: null };
  }

  if (error) return { error: error.message };

  revalidatePath('/admin/classrooms');
  return { data, error: null };
}

/**
 * Delete a course from the current admin's school.
 */
export async function deleteCourse(courseId: string) {
  const adminClient = createAdminClient();
  const { createClient } = await import('@/app/_lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await adminClient
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  const { data: subject } = await adminClient
    .from('subjects')
    .select('school_id')
    .eq('id', courseId)
    .single();

  if (!subject || subject.school_id !== profile?.school_id) {
    return { error: 'Unauthorized or course not found.' };
  }

  const { error } = await adminClient.from('subjects').delete().eq('id', courseId);
  if (error) return { error: error.message };

  revalidatePath('/admin/classrooms');
  return { error: null };
}

/**
 * Get school info including institution_type for the current logged-in admin.
 */
export async function getSchoolInfoForAdmin() {
  const adminClient = createAdminClient();
  const { createClient } = await import('@/app/_lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data: profile } = await adminClient
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) return { data: null, error: 'No school found' };

  const { data, error } = await adminClient
    .from('schools')
    .select('id, name, institution_type, logo_url, primary_color')
    .eq('id', profile.school_id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
