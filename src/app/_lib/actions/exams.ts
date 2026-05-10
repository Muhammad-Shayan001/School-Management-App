'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createExam(params: {
  class_id: string;
  subject_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room?: string;
  term?: string;
  title?: string;
}) {
  console.log('createExam params:', params);
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Use adminClient to get profile to bypass RLS
  const { data: profile } = await adminClient
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) {
    console.error('Create Exam Error: No school_id found for user', user.id);
    return { error: 'Your profile is not associated with any school. Please complete your profile setup.' };
  }

  // Validation
  if (!params.class_id || !params.subject_id || !params.exam_date) {
    console.error('Create Exam Error: Missing required fields', params);
    return { error: 'Class, Subject, and Date are required.' };
  }

  // Insert using admin client to handle complex relations
  const { data, error } = await adminClient
    .from('exam_schedules')
    .insert({
      title: params.title || 'Examination',
      class_id: params.class_id,
      subject_id: params.subject_id,
      exam_date: params.exam_date,
      start_time: params.start_time || null,
      end_time: params.end_time || null,
      room: params.room || '',
      term: params.term || 'Final Term',
      school_id: profile.school_id,
      teacher_id: user.id
    })
    .select();

  if (error) {
    console.error('Create Exam Database Error:', error);
    return { error: 'Database Error: ' + error.message };
  }

  console.log('Successfully created exam:', data);

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function addExamSchedule(formData: FormData) {
  const params = {
    class_id: formData.get('class_id') as string,
    subject_id: formData.get('subject_id') as string,
    exam_date: formData.get('exam_date') as string,
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
    title: formData.get('title') as string,
    room: formData.get('room') as string || '',
    term: formData.get('term') as string || 'Final Term',
  };
  return createExam(params);
}

export async function deleteExam(id: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('exam_schedules').delete().eq('id', id);
  if (error) return { error: error.message };
  
  revalidatePath('/', 'layout');
  return { success: true };
}

export const deleteExamSchedule = deleteExam;

export async function getExamSchedules(filters?: any) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data: profile } = await adminClient
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) return { data: [] };

  let query = adminClient
    .from('exam_schedules')
    .select(`
      *,
      subjects(name),
      classes(name, section),
      profiles!teacher_id(full_name)
    `)
    .eq('school_id', profile.school_id)
    .order('exam_date', { ascending: true })
    .order('start_time', { ascending: true });

  // Handle filters
  if (typeof filters === 'string') {
    if (filters && filters !== 'all' && filters !== '') {
      query = query.eq('class_id', filters);
    }
  } else if (filters && typeof filters === 'object') {
    if (filters.class_id && filters.class_id !== 'all' && filters.class_id !== '') {
      query = query.eq('class_id', filters.class_id);
    }
    if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
    if (filters.term) query = query.eq('term', filters.term);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getExamSchedules Database Error:', error);
    return { data: [], error: error.message };
  }
  return { data: data || [] };
}

export async function getStudentExams() {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  // 1. Get the student's class
  const { data: studentProfile } = await adminClient
    .from('student_profiles')
    .select('class_id')
    .eq('user_id', user.id)
    .single();

  if (!studentProfile?.class_id) {
    console.log('No class_id found for student', user.id);
    return { data: [] };
  }

  // 2. Fetch exams for that class
  const { data, error } = await adminClient
    .from('exam_schedules')
    .select(`
      *,
      subjects(name),
      classes(name, section),
      profiles!teacher_id(full_name)
    `)
    .eq('class_id', studentProfile.class_id)
    .order('exam_date', { ascending: true });

  if (error) {
    console.error('getStudentExams Database Error:', error);
    return { data: [], error: error.message };
  }
  
  console.log(`Fetched ${data?.length || 0} exams for class_id: ${studentProfile.class_id}`);
  return { data: data || [] };
}
