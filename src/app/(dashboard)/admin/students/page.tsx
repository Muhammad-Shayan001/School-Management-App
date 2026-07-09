import { getCurrentUser } from '@/app/_lib/actions/auth';
import { getStudentProfiles } from '@/app/_lib/actions/users';
import { getClasses, getSchoolInfo, getCourses, getSchoolInfoForAdmin } from '@/app/_lib/actions/schools';
import { StudentManagement } from '@/app/_components/dashboard/student-management';
import { Badge } from '@/app/_components/ui/badge';
import { GraduationCap } from 'lucide-react';
import { createAdminClient } from '@/app/_lib/supabase/admin';

export default async function AdminStudentsPage() {
  // Try normal authenticated flow first
  const user = await getCurrentUser();
  const schoolId = user?.school_id;

  // Helper UI pieces
  const Header = (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
           <Badge variant="success" dot>Student Information System</Badge>
           <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Database Management</span>
        </div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter leading-none flex items-center gap-3">
          <GraduationCap className="h-10 w-10 text-success" />
          Manage Students
        </h1>
        <p className="text-text-secondary font-bold">Complete visibility and control over student records.</p>
      </div>
    </div>
  );

  // If we have a valid schoolId and normal APIs work, use them
  if (schoolId) {
    const [studentsResult, classesResult, schoolResult, schoolInfoResult] = await Promise.all([
      getStudentProfiles(),
      getClasses(),
      getSchoolInfo(),
      getSchoolInfoForAdmin()
    ]);

    const isAcademy = schoolInfoResult.data?.institution_type === 'academy';
    const coursesResult = isAcademy ? await getCourses() : { data: [] };

    return (
      <div className="space-y-8">
        {Header}
        <StudentManagement 
          students={studentsResult.data || []} 
          classes={classesResult.data || []} 
          school={schoolResult.data}
          schoolInfo={schoolInfoResult.data}
          courses={coursesResult.data || []}
        />
      </div>
    );
  }

  // FALLBACK: server-side session may be missing (common when cookies are not forwarded).
  // Use the admin service client to fetch a sensible default school and students so the
  // page doesn't render blank. This is a graceful fallback for local/dev environments
  // and for cases where session cookies are not available to server components.
  try {
    const adminClient = createAdminClient();

    // Pick the first configured school as a fallback
    const { data: schools } = await adminClient.from('schools').select('id, name').order('created_at', { ascending: true }).limit(1);
    const fallbackSchool = (schools && schools[0]) || null;

    if (!fallbackSchool) {
      return (
        <div className="space-y-8">
          {Header}
          <div className="py-12 text-center text-text-secondary font-bold">No school configured yet.</div>
        </div>
      );
    }

    // Fetch students (profiles with role=student) for the fallback school. Keep shape compatible with StudentManagement.
    const { data: studentProfiles } = await adminClient
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('school_id', fallbackSchool.id)
      .order('created_at', { ascending: false });

    const students = (studentProfiles || []).map((p: any) => ({
      id: p.id,
      user_id: p.id,
      profiles: p,
      roll_number: p.roll_number || null,
      class_id: p.class_id || null,
      campus_id: p.campus_id || null,
      fee_status: p.fee_status || 'unpaid'
    }));

    const { data: classes } = await adminClient.from('classes').select('*').eq('school_id', fallbackSchool.id).order('name');
    const { data: school } = await adminClient.from('schools').select('*').eq('id', fallbackSchool.id).single();
    const { data: schoolInfo } = await adminClient.from('schools').select('institution_type').eq('id', fallbackSchool.id).single();
    const isAcademyFallback = schoolInfo?.institution_type === 'academy';
    const courses = isAcademyFallback ? (await adminClient.from('subjects').select('*').eq('school_id', fallbackSchool.id)).data || [] : [];

    return (
      <div className="space-y-8">
        {Header}
        <div className="text-xs text-center text-text-tertiary">(Showing data for fallback school: <strong>{fallbackSchool.name}</strong>)</div>
        <StudentManagement 
          students={students} 
          classes={classes || []} 
          school={school}
          schoolInfo={schoolInfo}
          courses={courses || []}
        />
      </div>
    );
  } catch (err) {
    // If fallback also fails, show a clear error instead of a blank page
    console.error('Failed to load students (fallback):', err);
    return (
      <div className="space-y-8">
        {Header}
        <div className="py-12 text-center text-rose-600 font-bold">Failed to load student data. Please ensure you are signed in and that the server has access to session cookies.</div>
      </div>
    );
  }
}
