import Link from 'next/link';
import { StatsCard } from '@/app/_components/dashboard/stats-card';
import { getCurrentUser } from '@/app/_lib/actions/auth';
import { getUsers } from '@/app/_lib/actions/users';
import { ROLES } from '@/app/_lib/utils/constants';
import { 
  Users, FileText, ClipboardCheck, BarChart3, 
  UserCheck, Megaphone, Calendar, ClipboardList,
  PlusCircle, Sparkles
} from 'lucide-react';
import { AnnouncementWidget } from '@/app/_components/dashboard/AnnouncementWidget';
import { Card } from '@/app/_components/ui/card';
import { Badge } from '@/app/_components/ui/badge';
import { cn } from '@/app/_lib/utils/cn';

export default async function TeacherDashboard() {
  const user = await getCurrentUser();
  const schoolId = user?.school_id;

  // Fetch students for this school
  const { data: students } = await getUsers({ 
    role: ROLES.STUDENT, 
    school_id: schoolId || undefined 
  });

  const pendingStudents = students?.filter((s) => s.status === 'pending').length || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <Badge variant="default" className="bg-accent/5 text-accent border-accent/20 font-black px-3 py-1 uppercase text-[10px]">
               Faculty Member
             </Badge>
             <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Portal Overview</span>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter">Teacher Dashboard</h1>
          <p className="text-text-secondary font-medium">Welcome back, {user?.full_name}</p>
        </div>

        {pendingStudents > 0 && (
           <Link href="/teacher/students" className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl group hover:bg-amber-100 transition-all">
              <div className="h-10 w-10 rounded-xl bg-amber-200 flex items-center justify-center text-amber-700 font-black">
                 {pendingStudents}
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Awaiting Approval</p>
                 <p className="text-xs font-bold text-amber-700">Student requests pending</p>
              </div>
              <PlusCircle className="h-4 w-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
           </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        <StatsCard 
          title="Students" 
          value={students?.length || 0} 
          icon={Users} 
          variant="accent" 
          subtitle={pendingStudents > 0 ? `${pendingStudents} pending` : 'All active'} 
        />
        <StatsCard title="Assignments" value="-" icon={FileText} variant="success" subtitle="Active tasks" />
        <StatsCard title="Attendance" value="-" icon={ClipboardCheck} variant="warning" subtitle="Daily records" />
        <StatsCard title="Results" value="-" icon={BarChart3} variant="default" subtitle="Compiled grades" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <Card className="p-8 border-none bg-white shadow-xl">
               <h2 className="text-xl font-black text-text-primary mb-8 flex items-center gap-2">
                 <ClipboardList className="h-5 w-5 text-accent" /> Professional Quick Actions
               </h2>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Exam Schedule', href: '/teacher/exam-timetable', icon: <ClipboardList className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Attendance', href: '/teacher/attendance', icon: <ClipboardCheck className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Student Results', href: '/teacher/results', icon: <BarChart3 className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Manage Students', href: '/teacher/students', icon: <Users className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Timetable', href: '/teacher/timetable', icon: <Calendar className="h-5 w-5" />, color: 'bg-purple-50 text-purple-600' },
                    { label: 'Assignments', href: '/teacher/assignments', icon: <FileText className="h-5 w-5" />, color: 'bg-rose-50 text-rose-600' },
                  ].map((a) => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className="group p-6 rounded-2xl bg-bg-tertiary hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-border/50"
                    >
                      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", a.color)}>
                        {a.icon}
                      </div>
                      <span className="text-xs font-black text-text-primary uppercase tracking-tight">
                        {a.label}
                      </span>
                    </Link>
                  ))}
               </div>
            </Card>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl relative overflow-hidden group">
               <Sparkles className="absolute top-0 right-0 p-8 h-40 w-40 opacity-10 group-hover:scale-125 transition-transform" />
               <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-2">Automated Result System</h3>
                  <p className="text-sm opacity-80 max-w-md mb-6 font-medium leading-relaxed">
                    Exams schedules are now directly linked to marksheets. Student rosters are loaded automatically after every test.
                  </p>
                  <Link href="/teacher/results">
                     <button className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg">
                        Get Started
                     </button>
                  </Link>
               </div>
            </div>
         </div>

         <div className="lg:col-span-1">
            <Card className="p-8 border-none bg-white shadow-xl h-full">
               <h2 className="text-xl font-black text-text-primary mb-6 flex items-center justify-between">
                 School News
                 <Megaphone className="h-5 w-5 text-accent" />
               </h2>
               <AnnouncementWidget role="teacher" />
            </Card>
         </div>
      </div>
    </div>
  );
}
