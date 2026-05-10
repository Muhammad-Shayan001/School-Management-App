'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getTeacherAssignments() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: [], error: 'Unauthorized' };

  // 1. Fetch raw assignments
  const { data: assignments, error } = await adminClient
    .from('teacher_assignments')
    .select('class_id, subject_id')
    .eq('teacher_id', user.id);

  if (error) return { data: [], error: error.message };
  if (!assignments || assignments.length === 0) return { data: [], error: null };

  // 2. Fetch classes and subjects separately to avoid join issues (Schema Cache safety)
  const classIds = [...new Set(assignments.map(a => a.class_id))];
  const subjectIds = [...new Set(assignments.map(a => a.subject_id))];

  const [classesRes, subjectsRes] = await Promise.all([
    adminClient.from('classes').select('id, name, section').in('id', classIds),
    adminClient.from('subjects').select('id, name').in('id', subjectIds)
  ]);

  const classesMap = new Map(classesRes.data?.map(c => [c.id, c]));
  const subjectsMap = new Map(subjectsRes.data?.map(s => [s.id, s]));

  // 3. Assemble the data
  const result = assignments.map(a => ({
    ...a,
    classes: classesMap.get(a.class_id),
    subjects: subjectsMap.get(a.subject_id)
  })).filter(a => a.classes && a.subjects); // Only include valid assignments

  return { data: result, error: null };
}

export async function getClasses() {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single();
  
  const { data, error } = await adminClient
    .from('classes')
    .select('*')
    .eq('school_id', profile?.school_id)
    .order('name');
  
  return { data: data || [], error: error?.message };
}

export async function getSubjects() {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single();
  
  const { data, error } = await adminClient
    .from('subjects')
    .select('*')
    .eq('school_id', profile?.school_id)
    .order('name');
  
  return { data: data || [], error: error?.message };
}

export async function getTeacherSyllabi() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: [], error: 'Unauthorized' };

  // 1. Get teacher profile to see if they are a class teacher
  const { data: teacherProfile } = await adminClient
    .from('teacher_profiles')
    .select('class_id, is_class_teacher')
    .eq('user_id', user.id)
    .single();

  // 2. Build query: Syllabi created by teacher OR syllabi for their class (if they are a class teacher)
  let query = adminClient
    .from('syllabi')
    .select(`
      *,
      classes(name, section),
      subjects(name),
      teacher:profiles!teacher_id(full_name),
      syllabus_chapters(*)
    `);

  if (teacherProfile?.is_class_teacher && teacherProfile.class_id) {
    // If class teacher, see their own OR any syllabus for their class
    query = query.or(`teacher_id.eq.${user.id},class_id.eq.${teacherProfile.class_id}`);
  } else {
    // Otherwise only see their own
    query = query.eq('teacher_id', user.id);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  // sort chapters by order_index
  data?.forEach(s => {
    s.syllabus_chapters.sort((a: any, b: any) => a.order_index - b.order_index);
  });

  if (error) return { data: [], error: error.message };
  return { data, error: null };
}

export async function getAdminSyllabi(filters?: { classId?: string; subjectId?: string; teacherId?: string }) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: [], error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single();

  let query = adminClient
    .from('syllabi')
    .select(`
      *,
      classes(name, section),
      subjects(name),
      teacher:profiles!teacher_id(full_name),
      syllabus_chapters(*)
    `)
    .eq('school_id', profile?.school_id)
    .order('created_at', { ascending: false });

  if (filters?.classId) query = query.eq('class_id', filters.classId);
  if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
  if (filters?.teacherId) query = query.eq('teacher_id', filters.teacherId);

  const { data, error } = await query;

  data?.forEach(s => {
    s.syllabus_chapters.sort((a: any, b: any) => a.order_index - b.order_index);
  });

  if (error) return { data: [], error: error.message };
  return { data, error: null };
}

export async function getStudentSyllabi() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: [], error: 'Unauthorized' };

  const { data: student } = await adminClient
    .from('student_profiles')
    .select('class_id')
    .eq('user_id', user.id)
    .single();

  if (!student?.class_id) return { data: [], error: null };

  const { data, error } = await adminClient
    .from('syllabi')
    .select(`
      *,
      classes(name, section),
      subjects(name),
      teacher:profiles!teacher_id(full_name),
      syllabus_chapters(*)
    `)
    .eq('class_id', student.class_id)
    .order('created_at', { ascending: false });

  data?.forEach(s => {
    s.syllabus_chapters.sort((a: any, b: any) => a.order_index - b.order_index);
  });

  if (error) return { data: [], error: error.message };
  return { data, error: null };
}

export async function createSyllabus(payload: {
  title: string;
  academic_session: string;
  class_id: string;
  subject_id: string;
  chapters: { title: string; description: string; start_date: string; end_date: string; order_index: number }[];
}) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role, school_id').eq('id', user.id).single();
  if (!profile) return { error: 'Profile not found' };

  // SECURITY CHECK: If teacher, verify they are assigned to this class and subject
  if (profile.role === 'teacher') {
    const { data: assignment } = await adminClient
      .from('teacher_assignments')
      .select('id')
      .eq('teacher_id', user.id)
      .eq('class_id', payload.class_id)
      .eq('subject_id', payload.subject_id)
      .maybeSingle();

    if (!assignment) {
      return { error: 'You are not assigned to this class and subject.' };
    }
  }

  // Check for duplicates
  const { data: existing } = await adminClient
    .from('syllabi')
    .select('id')
    .eq('class_id', payload.class_id)
    .eq('subject_id', payload.subject_id)
    .eq('academic_session', payload.academic_session)
    .eq('school_id', profile.school_id)
    .maybeSingle();

  if (existing) {
    return { error: 'A syllabus for this class, subject, and session already exists.' };
  }

  // Create syllabus
  const { data: syllabus, error: syllabusError } = await adminClient
    .from('syllabi')
    .insert({
      title: payload.title,
      academic_session: payload.academic_session,
      class_id: payload.class_id,
      subject_id: payload.subject_id,
      teacher_id: user.id,
      school_id: profile.school_id
    })
    .select('id')
    .single();

  if (syllabusError) return { error: syllabusError.message };

  // Create chapters
  if (payload.chapters && payload.chapters.length > 0) {
    const chaptersToInsert = payload.chapters.map(c => ({
      syllabus_id: syllabus.id,
      title: c.title,
      description: c.description,
      start_date: c.start_date || null,
      end_date: c.end_date || null,
      order_index: c.order_index
    }));

    const { error: chapterError } = await adminClient
      .from('syllabus_chapters')
      .insert(chaptersToInsert);

    if (chapterError) {
      // Rollback
      await adminClient.from('syllabi').delete().eq('id', syllabus.id);
      return { error: 'Failed to add chapters: ' + chapterError.message };
    }
  }

  revalidatePath('/teacher/syllabus');
  revalidatePath('/admin/syllabus');
  return { success: true };
}

export async function updateSyllabus(id: string, payload: {
  title: string;
  chapters: { id?: string; title: string; description: string; start_date: string; end_date: string; order_index: number }[];
}) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Update Syllabus title
  const { error: updateErr } = await adminClient
    .from('syllabi')
    .update({ title: payload.title, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateErr) return { error: updateErr.message };

  // Sync chapters (simplest approach: delete all and recreate, or upsert)
  // Let's delete all existing chapters and recreate to handle removals easily
  await adminClient.from('syllabus_chapters').delete().eq('syllabus_id', id);

  if (payload.chapters && payload.chapters.length > 0) {
    const chaptersToInsert = payload.chapters.map(c => ({
      syllabus_id: id,
      title: c.title,
      description: c.description,
      start_date: c.start_date || null,
      end_date: c.end_date || null,
      order_index: c.order_index
    }));

    await adminClient.from('syllabus_chapters').insert(chaptersToInsert);
  }

  revalidatePath('/teacher/syllabus');
  revalidatePath('/admin/syllabus');
  return { success: true };
}

export async function deleteSyllabus(id: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('syllabi').delete().eq('id', id);
  if (error) return { error: error.message };
  
  revalidatePath('/teacher/syllabus');
  revalidatePath('/admin/syllabus');
  revalidatePath('/student/syllabus');
  return { success: true };
}

export async function toggleChapterCompletion(chapterId: string, isCompleted: boolean) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('syllabus_chapters')
    .update({ is_completed: isCompleted })
    .eq('id', chapterId);

  if (error) return { error: error.message };

  revalidatePath('/teacher/syllabus');
  revalidatePath('/admin/syllabus');
  revalidatePath('/student/syllabus');
  return { success: true };
}
