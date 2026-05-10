import { createClient } from '@/app/_lib/supabase/server';
import { createAdminClient } from '@/app/_lib/supabase/admin';
import { redirect } from 'next/navigation';
import TeacherTimetableBuilderClient from './TeacherTimetableBuilderClient';

export const metadata = {
  title: 'Timetable Builder | SchoolMS',
};

export default async function TeacherTimetableBuilderPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await adminClient
    .from('teacher_profiles')
    .select('is_class_teacher, class_id, classes(name, section)')
    .eq('user_id', user.id)
    .single();

  if (!profile || !profile.is_class_teacher || !profile.class_id) {
    return (
      <div className="p-12 text-center text-danger font-bold">
        Access Denied: You are not assigned as a Class Teacher.
      </div>
    );
  }

  const classData = Array.isArray(profile.classes) ? profile.classes[0] : profile.classes;
  const classNameStr = `${classData?.name} ${classData?.section ? `- Section ${classData.section}` : ''}`;

  return <TeacherTimetableBuilderClient classId={profile.class_id} classNameStr={classNameStr} />;
}
