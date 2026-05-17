import { getCurrentUser } from '@/app/_lib/actions/auth';
import { getStudentProfiles } from '@/app/_lib/actions/users';
import { getClasses, getSchoolInfo } from '@/app/_lib/actions/schools';
import { StudentManagement } from '@/app/_components/dashboard/student-management';
import { Badge } from '@/app/_components/ui/badge';
import { GraduationCap } from 'lucide-react';

export default async function AdminStudentsPage() {
  const user = await getCurrentUser();
  const schoolId = user?.school_id;

  if (!schoolId) return null;

  const [studentsResult, classesResult, schoolResult] = await Promise.all([
    getStudentProfiles(),
    getClasses(),
    getSchoolInfo()
  ]);

  return (
    <div className="space-y-8">
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
          <p className="text-text-secondary font-bold">
            Complete visibility and control over student records.
          </p>
        </div>
      </div>

      <StudentManagement 
        students={studentsResult.data || []} 
        classes={classesResult.data || []} 
        school={schoolResult.data}
      />
    </div>
  );
}
