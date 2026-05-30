'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath, unstable_cache } from 'next/cache';

/**
 * Internal cached function for fetching full profile data.
 */
/**
 * Internal cached function for fetching full profile data.
 * We use user.id in the key to prevent cross-user data leakage.
 */
const getFullProfileInternal = (userId?: string) => unstable_cache(
  async (id: string) => {
    try {
      const adminClient = createAdminClient();
      
      // 1. Fetch core profile
      const { data: profile, error: pErr } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (!profile || pErr) {
        console.error('Profile fetch error:', pErr);
        return { data: null, error: 'Profile not found' };
      }

      // 2. Fetch school branding
      let school = null;
      if (profile.school_id) {
        const { data: sData } = await adminClient.from('schools').select('*').eq('id', profile.school_id).single();
        school = sData;
      }

      // 3. Fetch role-specific data
      let extraData: any = {};
      if (profile.role === 'student') {
        const { data: student } = await adminClient.from('student_profiles').select('*, classes(name, section)').eq('user_id', id).single();
        extraData = { student };
      } else if (profile.role === 'teacher') {
        const teacherPromise = adminClient.from('teacher_profiles').select('*, classes(name, section)').eq('user_id', id).single();
        const assignmentsPromise = adminClient.from('teacher_assignments').select('*, subjects(name), classes(name, section)').eq('teacher_id', id);
        const [{ data: teacher }, { data: assignments }] = await Promise.all([teacherPromise, assignmentsPromise]);
        extraData = { teacher, assignments };
      } else if (profile.role === 'admin' || profile.role === 'super_admin') {
        const { data: campuses } = await adminClient
          .from('admin_campuses')
          .select('*, schools(*)')
          .eq('admin_id', id);
        extraData = { campuses };
      }

      return { data: { ...profile, school: school, schools: school, ...extraData }, error: null };
    } catch (error) {
      console.error('Error in getFullProfileInternal:', error);
      return { data: null, error: 'Internal Server Error' };
    }
  },
  ['full-profile'],
  { revalidate: 60, tags: ['profile'] }
);

/**
 * Helper to get the current user's profile.
 */
export async function getFullProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };
  
  // Call the cached function with user-specific key
  return getFullProfileInternal(user.id)(user.id);
}

// Helper to clean form data values for database safety
const clean = (val: any) => {
  if (val === null || val === undefined || val === 'null' || val === 'undefined' || val === '') {
    return null;
  }
  return val;
};

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  console.log('--- START PROFILE UPDATE ---');
  console.log('User ID from Auth:', user.id);

  const fullName = clean(formData.get('full_name')) as string;
  const phone = clean(formData.get('phone')) as string;
  const avatarUrl = clean(formData.get('avatar_url')) as string;

  console.log('Updating profiles table for:', user.id);
  const { error: pUpdateErr } = await adminClient.from('profiles').update({
    full_name: fullName,
    phone,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id);

  if (pUpdateErr) {
    console.error('PROFILES TABLE UPDATE ERROR:', pUpdateErr);
    return { error: pUpdateErr.message };
  }

  const { data: currentProfile, error: profileFetchErr } = await adminClient.from('profiles').select('role, school_id').eq('id', user.id).single();
  
  if (profileFetchErr || !currentProfile) {
    console.error('PROFILE FETCH ERROR:', profileFetchErr);
    return { error: 'Profile state lost during update' };
  }

  console.log('Detected Role:', currentProfile.role);

  if (currentProfile.role === 'student') {
    const studentData = {
      user_id: user.id,
      school_id: currentProfile.school_id,
      roll_number: clean(formData.get('roll_number')),
      cnic: clean(formData.get('cnic')),
      class_id: clean(formData.get('class_id')),
      campus_id: clean(formData.get('campus_id')),
      section: clean(formData.get('section')),
      dob: clean(formData.get('dob')),
      gender: clean(formData.get('gender')),
      student_email: clean(formData.get('student_email')),
      phone: clean(formData.get('phone')),
      parent_name: clean(formData.get('parent_name')),
      parent_cnic: clean(formData.get('parent_cnic')),
      parent_phone: clean(formData.get('parent_phone')),
      address: clean(formData.get('address')),
      admission_date: clean(formData.get('admission_date')),
    };
    
    console.log('Upserting student_profiles for:', user.id);
    const { error: err } = await adminClient.from('student_profiles').upsert(studentData, { onConflict: 'user_id' });
    if (err) {
      console.error('STUDENT UPSERT ERROR:', err);
      return { error: err.message };
    }
  } else if (currentProfile.role === 'teacher') {
    const teacherData = {
      user_id: user.id,
      school_id: currentProfile.school_id,
      teacher_id: clean(formData.get('teacher_id')),
      cnic: clean(formData.get('cnic')),
      phone: clean(formData.get('phone')),
      subjects: clean(formData.get('subjects')),
      is_class_teacher: formData.get('is_class_teacher') === 'true' || formData.get('is_class_teacher') === 'on',
      class_id: clean(formData.get('class_id')),
      campus_id: clean(formData.get('campus_id')),
      qualification: clean(formData.get('qualification')),
      experience: clean(formData.get('experience')),
      address: clean(formData.get('address')),
      gender: clean(formData.get('gender')),
      dob: clean(formData.get('dob')),
    };
    
    console.log('Upserting teacher_profiles for:', user.id);
    const { error: err } = await adminClient.from('teacher_profiles').upsert(teacherData, { onConflict: 'user_id' });
    if (err) {
      console.error('TEACHER UPSERT ERROR:', err);
      return { error: err.message };
    }
  } else if (currentProfile.role === 'admin' || currentProfile.role === 'super_admin') {
    const adminData = {
      user_id: user.id,
      school_id: currentProfile.school_id,
      cnic: clean(formData.get('cnic')),
      phone: clean(formData.get('phone')),
      address: clean(formData.get('address')),
    };
    console.log('Updating admins/profiles extra for:', user.id);
    // Note: Assuming there is an 'admins' table or similar for extra admin info
    const { error: err } = await adminClient.from('profiles').update(adminData).eq('id', user.id);
    if (err) {
      console.error('ADMIN UPDATE ERROR:', err);
      return { error: err.message };
    }
  }

  console.log('--- PROFILE UPDATE SUCCESSFUL ---');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function uploadFile(formData: FormData) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const file = formData.get('file') as File;
  const bucket = (formData.get('bucket') as string) || 'profiles';
  const userId = formData.get('userId') as string;

  if (!file) return { error: 'No file provided' };

  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}.${fileExt}`;

  const { data, error } = await adminClient.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true
    });

  if (error) {
    console.error('SERVER UPLOAD ERROR:', error);
    return { error: error.message };
  }

  const { data: { publicUrl } } = adminClient.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { publicUrl };
}

/**
 * Upload a dynamically generated file (base64) to Supabase Storage
 * and return a public HTTPS URL. Used by the Android WebView app
 * to convert blob/data URI downloads into real downloadable URLs.
 */
export async function uploadTempFile(base64Data: string, fileName: string, mimeType: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    // Decode base64 to binary using Node.js Buffer (much faster and memory-safe for large files)
    const buffer = Buffer.from(base64Data, 'base64');

    // Create unique path under temp_downloads/
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `temp_downloads/${user.id}/${timestamp}_${safeName}`;

    const { error } = await adminClient.storage
      .from('profiles')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('TEMP FILE UPLOAD ERROR:', error);
      return { error: error.message };
    }

    const { data: { publicUrl } } = adminClient.storage
      .from('profiles')
      .getPublicUrl(filePath);

    const downloadUrl = `${publicUrl}?download=${encodeURIComponent(safeName)}`;

    return { publicUrl: downloadUrl, fileName: safeName };
  } catch (err: any) {
    console.error('TEMP FILE UPLOAD EXCEPTION:', err);
    return { error: err.message || 'Upload failed' };
  }
}
