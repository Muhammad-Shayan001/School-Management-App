'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getClasses() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data: profile } = await adminClient.from('profiles').select('school_id').eq('id', user.id).single();
  if (!profile?.school_id) return { data: null, error: 'No school associated' };

  // Fetch existing classes using adminClient
  const { data: existingClasses, error } = await adminClient
    .from('classes')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('name');

  if (error) return { data: null, error: error.message };

  // Ensure Class 1-10 exist
  const { CLASS_NAMES } = await import('@/app/_lib/utils/constants');
  const existingNames = new Set(existingClasses?.map(c => c.name));
  const missingNames = CLASS_NAMES.filter(name => !existingNames.has(name));

  if (missingNames.length > 0) {
    const newClasses = missingNames.map(name => ({
      name,
      school_id: profile.school_id,
      section: 'A'
    }));
    await adminClient.from('classes').insert(newClasses);
    
    // Fetch again after seeding using adminClient
    const { data: updatedClasses } = await adminClient
      .from('classes')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('name');
    return { data: updatedClasses, error: null };
  }

  return { data: existingClasses, error: null };
}

export async function getSubjects() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data: profile } = await adminClient.from('profiles').select('school_id').eq('id', user.id).single();
  if (!profile?.school_id) return { data: null, error: 'No school associated' };

  const { data, error } = await adminClient
    .from('subjects')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('name');

  return { data, error: error?.message };
}

export async function getTeachers() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data: profile } = await adminClient.from('profiles').select('school_id').eq('id', user.id).single();
  if (!profile?.school_id) return { data: null, error: 'No school associated' };

  const { data, error } = await adminClient
    .from('profiles')
    .select('id, full_name')
    .eq('school_id', profile.school_id)
    .eq('role', 'teacher')
    .order('full_name');

  return { data, error: error?.message };
}

export async function getTimetable(classId: string) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('timetable')
    .select(`
      *,
      subject:subjects(name),
      teacher:profiles(full_name)
    `)
    .eq('class_id', classId)
    .order('period_number');

  return { data, error: error?.message };
}

export async function addTimetableEntry(formData: FormData) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const class_id = formData.get('class_id') as string;
  const { data: profile } = await supabase.from('profiles').select('school_id, role').eq('id', user.id).single();
  if (!profile?.school_id) return { error: 'No school associated' };

  let isAllowed = profile.role === 'admin' || profile.role === 'super_admin';
  if (profile.role === 'teacher') {
    const { data: teacherProfile } = await adminClient.from('teacher_profiles').select('class_id, is_class_teacher').eq('user_id', user.id).single();
    if (teacherProfile?.is_class_teacher && teacherProfile.class_id === class_id) {
      isAllowed = true;
    }
  }

  if (!isAllowed) return { error: 'Unauthorized: You can only edit your assigned class timetable.' };

  const day_of_week = formData.get('day_of_week') as string;
  const period_number = parseInt(formData.get('period_number') as string);
  const start_time = formData.get('start_time') as string;
  const end_time = formData.get('end_time') as string;
  let subject_id = formData.get('subject_id') as string;
  const new_subject_name = formData.get('new_subject_name') as string;
  const teacher_id = formData.get('teacher_id') as string;

  if (!class_id || !day_of_week || !start_time || !end_time) {
    return { error: 'Required fields are missing' };
  }

  // Handle new subject creation
  if (new_subject_name) {
    const { data: newSub, error: subErr } = await adminClient
      .from('subjects')
      .insert({
        name: new_subject_name,
        school_id: profile.school_id
      })
      .select('id')
      .single();
    
    if (subErr) return { error: 'Failed to create subject: ' + subErr.message };
    subject_id = newSub.id;
  }

  const { error } = await adminClient.from('timetable').insert({
    class_id,
    day_of_week,
    period_number: period_number || 1,
    start_time,
    end_time,
    subject_id: subject_id || null,
    teacher_id: teacher_id || null,
    school_id: profile.school_id
  });

  if (error) return { error: error.message };

  return { success: true };
}

export async function deleteTimetableEntry(id: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  
  const { data: existing } = await adminClient.from('timetable').select('class_id').eq('id', id).single();
  if (!existing) return { error: 'Entry not found' };

  let isAllowed = profile?.role === 'admin' || profile?.role === 'super_admin';
  if (profile?.role === 'teacher') {
    const { data: teacherProfile } = await adminClient.from('teacher_profiles').select('class_id, is_class_teacher').eq('user_id', user.id).single();
    if (teacherProfile?.is_class_teacher && teacherProfile.class_id === existing.class_id) {
      isAllowed = true;
    }
  }

  if (!isAllowed) return { error: 'Unauthorized' };

  const { error } = await adminClient.from('timetable').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getStudentTimetable() {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  // Get class_id from student_profile
  const { data: studentProfile } = await adminClient
    .from('student_profiles')
    .select('class_id')
    .eq('user_id', user.id)
    .single();

  if (!studentProfile?.class_id) return { data: null, error: 'No class assigned' };

  return getTimetable(studentProfile.class_id);
}

export async function getTeacherTimetable() {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data, error } = await adminClient
    .from('timetable')
    .select(`
      *,
      subject:subjects(name),
      class:classes(name, section)
    `)
    .eq('teacher_id', user.id)
    .order('day_of_week')
    .order('period_number');

  return { data, error: error?.message };
}

export async function getTimetableForTeacher(teacherId: string) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('timetable')
    .select(`
      *,
      subject:subjects(name),
      class:classes(name, section)
    `)
    .eq('teacher_id', teacherId)
    .order('day_of_week')
    .order('period_number');

  return { data, error: error?.message };
}
