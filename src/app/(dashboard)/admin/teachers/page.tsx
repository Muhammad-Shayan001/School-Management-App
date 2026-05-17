import { getCurrentUser } from '@/app/_lib/actions/auth';
import { getTeacherProfiles } from '@/app/_lib/actions/users';
import { getClasses, getSubjects } from '@/app/_lib/actions/schools';
import { TeacherManagement } from '@/app/_components/dashboard/teacher-management';
import { Badge } from '@/app/_components/ui/badge';
import { GraduationCap } from 'lucide-react';

export default async function AdminTeachersPage() {
  const user = await getCurrentUser();
  const schoolId = user?.school_id;

  if (!schoolId) return null;

  const [teachersResult, classesResult, subjectsResult] = await Promise.all([
    getTeacherProfiles(),
    getClasses(),
    getSubjects()
  ]);

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="accent" dot>Faculty Information System</Badge>
             <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Database Management</span>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter leading-none flex items-center gap-3">
            <GraduationCap className="h-10 w-10 text-accent" />
            Manage Teachers
          </h1>
          <p className="text-text-secondary font-bold">
            Monitor and manage faculty records and assignments.
          </p>
        </div>
      </div>

      <TeacherManagement 
        teachers={teachersResult.data || []} 
        classes={classesResult.data || []}
        subjects={subjectsResult.data || []}
      />
    </div>
  );
}
