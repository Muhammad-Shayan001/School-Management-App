'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath, unstable_cache } from 'next/cache';

/**
 * Get the full profile for the current user.
 * Wrapped in unstable_cache for high-performance production environments.
 */
export const getFullProfile = unstable_cache(
  async () => {
    try {
      const supabase = await createClient();
      const adminClient = createAdminClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'Unauthorized' };

      const { data: profile } = await adminClient
        .from('profiles')
        .select('*, schools!fk_school(*)')
        .eq('id', user.id)
        .single();

      if (!profile) return { data: null, error: 'Profile not found' };

      let extraData: any = {};
      if (profile.role === 'student') {
        const { data: student } = await adminClient.from('student_profiles').select('*, classes(name, section)').eq('user_id', user.id).single();
        extraData = { student };
      } else if (profile.role === 'teacher') {
        const teacherPromise = adminClient.from('teacher_profiles').select('*, classes(name, section)').eq('user_id', user.id).single();
        const assignmentsPromise = adminClient.from('teacher_assignments').select('*, subjects(name), classes(name, section)').eq('teacher_id', user.id);
        const [{ data: teacher }, { data: assignments }] = await Promise.all([teacherPromise, assignmentsPromise]);
        extraData = { teacher, assignments };
      } else if (profile.role === 'admin' || profile.role === 'super_admin') {
        const { data: admin } = await adminClient.from('admins').select('*').eq('user_id', user.id).single();
        extraData = { admin };
      }

      return { data: { ...profile, ...extraData }, error: null };
    } catch (error) {
      console.error('Error in getFullProfile:', error);
      return { data: null, error: 'Internal Server Error' };
    }
  },
  ['full-profile'],
  { revalidate: 60, tags: ['profile'] }
);

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const fullName = formData.get('full_name') as string;
  const phone = formData.get('phone') as string;
  const avatarUrl = formData.get('avatar_url') as string;

  await adminClient.from('profiles').update({
    full_name: fullName,
    phone,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id);

  const { data: currentProfile } = await adminClient.from('profiles').select('role, school_id').eq('id', user.id).single();
  if (!currentProfile) return { error: 'Profile state lost' };

  if (currentProfile.role === 'student') {
    await adminClient.from('student_profiles').upsert({
      user_id: user.id,
      school_id: currentProfile.school_id,
      roll_number: formData.get('roll_number'),
      cnic: formData.get('cnic'),
      class_id: formData.get('class_id') || null,
      section: formData.get('section'),
      dob: formData.get('dob'),
      gender: formData.get('gender'),
      student_email: formData.get('student_email'),
      phone: formData.get('phone'),
      parent_name: formData.get('parent_name'),
      parent_cnic: formData.get('parent_cnic'),
      parent_phone: formData.get('parent_phone'),
      address: formData.get('address'),
      admission_date: formData.get('admission_date'),
    }, { onConflict: 'user_id' });
  } else if (currentProfile.role === 'teacher') {
    await adminClient.from('teacher_profiles').upsert({
      user_id: user.id,
      school_id: currentProfile.school_id,
      teacher_id: formData.get('teacher_id'),
      cnic: formData.get('cnic'),
      phone: formData.get('phone'),
      subjects: formData.get('subjects'),
      is_class_teacher: formData.get('is_class_teacher') === 'true' || formData.get('is_class_teacher') === 'on',
      class_id: formData.get('class_id') || null,
      qualification: formData.get('qualification'),
      experience: formData.get('experience'),
      address: formData.get('address'),
    }, { onConflict: 'user_id' });
  } else if (currentProfile.role === 'admin' || currentProfile.role === 'super_admin') {
    await adminClient.from('admins').upsert({
      user_id: user.id,
      school_id: currentProfile.school_id,
      cnic: formData.get('cnic'),
      phone: formData.get('phone'),
      address: formData.get('address'),
    }, { onConflict: 'user_id' });
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
