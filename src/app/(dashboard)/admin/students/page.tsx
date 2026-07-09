import { getCurrentUser } from '@/app/_lib/actions/auth';
import { getStudentProfiles } from '@/app/_lib/actions/users';
import { getClasses, getSchoolInfo, getCourses, getSchoolInfoForAdmin } from '@/app/_lib/actions/schools';
import { StudentManagement } from '@/app/_components/dashboard/student-management';
import { Badge } from '@/app/_components/ui/badge';
import { GraduationCap } from 'lucide-react';
import { createAdminClient } from '@/app/_lib/supabase/admin';

export default async function AdminStudentsPage() {
  const user = await getCurrentUser();
  const schoolId = user?.school_id;
  const isSuperAdmin = user?.role === 'super_admin';
  const adminClient = createAdminClient();

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

  async function fetchFallbackStudents(schoolId?: string) {
    let query = adminClient
      .from('student_profiles')
      .select('*, profiles(id, full_name, email, avatar_url, phone, status), classes(name, section)')
      .order('created_at', { ascending: false });

    if (schoolId) query = query.eq('school_id', schoolId);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data;
    }

    // If no student_profiles exist for this school, fall back to the student account records.
    let profileQuery = adminClient
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (schoolId) profileQuery = profileQuery.eq('school_id', schoolId);

    const { data: studentAccounts, error: profileError } = await profileQuery;
    if (profileError || !studentAccounts) return [];

    return studentAccounts.map((p: any) => ({
      id: p.id,
      user_id: p.id,
      profiles: p,
      roll_number: p.roll_number || null,
      class_id: p.class_id || null,
      campus_id: p.campus_id || null,
      fee_status: p.fee_status || 'unpaid',
      classes: null,
    }));
  }

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
    let students = studentsResult.data || [];
    let classes = classesResult.data || [];

    if ((!students || students.length === 0) || studentsResult.error) {
      students = await fetchFallbackStudents(schoolId);
    }

    return (
      <div className="space-y-8">
        {Header}
        <StudentManagement 
          students={students} 
          classes={classes} 
          school={schoolResult.data}
          schoolInfo={schoolInfoResult.data}
          courses={coursesResult.data || []}
        />
      </div>
    );
  }

  if (isSuperAdmin) {
    const students = await fetchFallbackStudents();
    const { data: classes } = await adminClient.from('classes').select('*').order('name');
    const { data: schoolInfo } = await adminClient.from('schools').select('institution_type').order('created_at', { ascending: true }).limit(1).single();
    const courses = schoolInfo?.institution_type === 'academy'
      ? (await adminClient.from('subjects').select('*').order('name')).data || []
      : [];

    return (
      <div className="space-y-8">
        {Header}
        <div className="text-xs text-center text-text-tertiary">(Showing student data for all schools as Super Admin)</div>
        <StudentManagement 
          students={students} 
          classes={classes || []} 
          school={null}
          schoolInfo={schoolInfo}
          courses={courses || []}
        />
      </div>
    );
  }

  try {
    const { data: schools } = await adminClient.from('schools').select('id, name, institution_type').order('created_at', { ascending: true }).limit(1);
    const fallbackSchool = (schools && schools[0]) || null;

    if (!fallbackSchool) {
      return (
        <div className="space-y-8">
          {Header}
          <div className="py-12 text-center text-text-secondary font-bold">No school configured yet.</div>
        </div>
      );
    }

    const students = await fetchFallbackStudents(fallbackSchool.id);
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
    console.error('Failed to load students (fallback):', err);
    return (
      <div className="space-y-8">
        {Header}
        <div className="py-12 text-center text-rose-600 font-bold">Failed to load student data. Please ensure you are signed in and that the server has access to session cookies.</div>
      </div>
    );
  }
}
