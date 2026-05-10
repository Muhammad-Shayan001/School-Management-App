import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import TeacherTimetableClient from './TeacherTimetableClient';

export const metadata = {
  title: 'My Timetable | SchoolMS',
};

export default async function TeacherTimetablePage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isClassTeacher = false;
  if (user) {
    const { data } = await adminClient.from('teacher_profiles').select('is_class_teacher').eq('user_id', user.id).single();
    isClassTeacher = !!data?.is_class_teacher;
  }

  return <TeacherTimetableClient isClassTeacher={isClassTeacher} />;
}
