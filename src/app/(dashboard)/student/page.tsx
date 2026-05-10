import Link from 'next/link';
import { StatsCard } from '@/app/_components/dashboard/stats-card';
import { getCurrentUser } from '@/app/_lib/actions/auth';
import { BarChart3, Calendar, Megaphone, FileText, UserCircle, ClipboardList, CreditCard } from 'lucide-react';
import { AnnouncementWidget } from '@/app/_components/dashboard/AnnouncementWidget';
import { NextExamWidget } from '@/app/_components/dashboard/NextExamWidget';

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Student Hub</h1>
          <p className="mt-1 text-sm text-text-secondary font-medium">Welcome back, {user?.full_name}</p>
        </div>
        <div className="w-full lg:w-auto lg:min-w-[350px]">
           <NextExamWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        <StatsCard title="My Results" value="-" icon={BarChart3} variant="accent" subtitle="View grades" />
        <StatsCard title="Timetable" value="-" icon={Calendar} variant="success" subtitle="Class schedule" />
        <StatsCard title="Announcements" value="-" icon={Megaphone} variant="warning" subtitle="School news" />
        <StatsCard title="Assignments" value="-" icon={FileText} variant="default" subtitle="Due tasks" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="glass-card p-8 bg-white border-none shadow-xl">
             <h2 className="text-xl font-black text-text-primary mb-6 flex items-center gap-2">
               <ClipboardList className="h-5 w-5 text-accent" /> Academic Quick Links
             </h2>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {[
                 {label:'Exam Schedule',href:'/student/exam-timetable',icon:<ClipboardList className="h-5 w-5"/>, color: 'text-accent bg-accent/10'},
                 {label:'My Results',href:'/student/results',icon:<BarChart3 className="h-5 w-5"/>, color: 'text-emerald-600 bg-emerald-50'},
                 {label:'Class Timetable',href:'/student/timetable',icon:<Calendar className="h-5 w-5"/>, color: 'text-blue-600 bg-blue-50'},
                 {label:'Assignments',href:'/student/assignments',icon:<FileText className="h-5 w-5"/>, color: 'text-purple-600 bg-purple-50'},
                 {label:'Digital ID',href:'/student/id-card',icon:<CreditCard className="h-5 w-5"/>, color: 'text-amber-600 bg-amber-50'},
                 {label:'My Profile',href:'/profile',icon:<UserCircle className="h-5 w-5"/>, color: 'text-rose-600 bg-rose-50'}
               ].map(a=>(
                 <Link key={a.label} href={a.href} className="group p-6 rounded-2xl bg-bg-tertiary hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-border/50">
                   <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${a.color}`}>
                     {a.icon}
                   </div>
                   <span className="text-xs font-black text-text-primary uppercase tracking-tight">{a.label}</span>
                 </Link>
               ))}
             </div>
           </div>
        </div>

        <div className="lg:col-span-1">
          <div className="glass-card p-8 bg-white border-none shadow-xl sticky top-8">
            <h2 className="text-xl font-black text-text-primary mb-6 flex items-center justify-between">
              Notice Board
              <Megaphone className="h-5 w-5 text-accent" />
            </h2>
            <AnnouncementWidget role="student" />
          </div>
        </div>
      </div>
    </div>
  );
}
