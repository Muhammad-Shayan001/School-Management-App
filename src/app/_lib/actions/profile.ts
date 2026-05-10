'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Get the full profile for the current user.
 * Uses the Admin Client to ensure data is always returned even if RLS is strict.
 */
export async function getFullProfile() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  // Get base profile
  const { data: profile, error: dbError } = await adminClient
    .from('profiles')
    .select('*, schools!fk_school(*)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { data: null, error: 'Profile not found' };
  }

  let extraData: any = {};
  
  // Fetch role-specific data using Admin Client for maximum reliability
  if (profile.role === 'student') {
    const { data: student } = await adminClient
      .from('student_profiles')
      .select('*, classes(name, section)')
      .eq('user_id', user.id)
      .single();
    extraData = { student };
  } else if (profile.role === 'teacher') {
    const { data: teacher } = await adminClient
      .from('teacher_profiles')
      .select('*, classes(name, section)')
      .eq('user_id', user.id)
      .single();
      
    // Fetch dynamic assignments
    const { data: assignments } = await adminClient
      .from('teacher_assignments')
      .select('*, subjects(name), classes(name, section)')
      .eq('teacher_id', user.id);
      
    extraData = { teacher, assignments };
  } else if (profile.role === 'admin' || profile.role === 'super_admin') {
    const { data: admin } = await adminClient
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();
    extraData = { admin };
  }

  return { data: { ...profile, ...extraData }, error: null };
}

/**
 * Update or Create the current user's profile data.
 */
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const fullName = formData.get('full_name') as string;
  const phone = formData.get('phone') as string;
  const avatarUrl = formData.get('avatar_url') as string;

  // 1. Update base profile
  await adminClient
    .from('profiles')
    .update({
      full_name: fullName,
      phone,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  // 2. Fetch current profile state
  const { data: currentProfile } = await adminClient
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!currentProfile) return { error: 'Profile state lost' };

  const role = currentProfile.role;

  // 3. Upsert role-specific data
  if (role === 'student') {
    const { error: studentErr } = await adminClient
      .from('student_profiles')
      .upsert({
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
    
    if (studentErr) return { error: 'Student details failed: ' + studentErr.message };

  } else if (role === 'teacher') {
    const { error: teacherErr } = await adminClient
      .from('teacher_profiles')
      .upsert({
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
      
    if (teacherErr) return { error: 'Teacher details failed: ' + teacherErr.message };

    const assignmentsStr = formData.get('assignments') as string;
    if (assignmentsStr) {
      try {
        const assignmentsData = JSON.parse(assignmentsStr);
        await adminClient.from('teacher_assignments').delete().eq('teacher_id', user.id);
        
        for (const a of assignmentsData) {
           if (!a.subject_name || !a.class_id) continue;
           let subjectId = null;
           
           // Use maybeSingle to prevent throwing an error if the subject does not exist
           const { data: existingSub, error: findError } = await adminClient
             .from('subjects')
             .select('id')
             .eq('name', a.subject_name)
             .eq('school_id', currentProfile.school_id)
             .maybeSingle();

           if (existingSub) {
             subjectId = existingSub.id;
           } else {
             const { data: newSub, error: insertErr } = await adminClient
               .from('subjects')
               .insert({ name: a.subject_name, school_id: currentProfile.school_id })
               .select('id')
               .single();
             if (newSub) subjectId = newSub.id;
           }

           if (subjectId) {
             await adminClient.from('teacher_assignments').insert({
               teacher_id: user.id,
               subject_id: subjectId,
               class_id: a.class_id,
               school_id: currentProfile.school_id
             });
           }
        }
      } catch (e) {
        console.error("Failed to parse or save assignments", e);
      }
    }

  } else if (role === 'admin' || role === 'super_admin') {
    const { error: adminErr } = await adminClient
      .from('admins')
      .upsert({
        user_id: user.id,
        school_id: currentProfile.school_id,
        cnic: formData.get('cnic'),
        phone: formData.get('phone'),
        address: formData.get('address'),
      }, { onConflict: 'user_id' });
    
    if (adminErr) return { error: 'Admin details failed: ' + adminErr.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
