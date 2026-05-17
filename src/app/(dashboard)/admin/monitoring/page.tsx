import { getCurrentUser } from '@/app/_lib/actions/auth';
import { getAdminAnalytics, getRecentActivity } from '@/app/_lib/actions/monitoring';
import { Badge } from '@/app/_components/ui/badge';
import { 
  Activity, ShieldCheck, ClipboardList, BookOpen, 
  Users, GraduationCap, Layers, CreditCard,
  TrendingUp, ArrowUpRight, Search, FileText
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/app/_lib/utils/cn';

export default async function SystemMonitoringPage() {
  const user = await getCurrentUser();
  const schoolId = user?.school_id;

  if (!schoolId) return null;

  const [stats, recentActivity] = await Promise.all([
    getAdminAnalytics(schoolId),
    getRecentActivity(schoolId)
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="danger" dot>Central Monitoring System</Badge>
             <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Real-time ERP Analytics</span>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter leading-none flex items-center gap-3">
            <Activity className="h-10 w-10 text-danger" />
            School Overview
          </h1>
          <p className="text-text-secondary font-bold">
            Live monitoring of all academic and administrative activities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Left Panel: Stats Breakdown */}
         <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <MetricCard 
                 title="Student Engagement" 
                 value={`${stats.attendanceRate}%`} 
                 subtitle={`${stats.attendanceToday} students active today`}
                 icon={Users}
                 color="text-emerald-500"
                 bg="bg-emerald-50"
               />
               <MetricCard 
                 title="Faculty Load" 
                 value={stats.totalTeachers} 
                 subtitle={`${stats.totalSubjects} subjects managed`}
                 icon={GraduationCap}
                 color="text-accent"
                 bg="bg-accent-subtle/30"
               />
               <MetricCard 
                 title="Financial Health" 
                 value={stats.feesPending === 0 ? "100%" : `${Math.max(0, 100 - (stats.feesPending / stats.totalStudents * 100)).toFixed(0)}%`} 
                 subtitle={`${stats.feesPending} pending fee records`}
                 icon={CreditCard}
                 color="text-amber-600"
                 bg="bg-amber-50"
               />
            </div>

            {/* Performance Charts Placeholder */}
            <div className="glass-card p-10 bg-white border-none shadow-xl rounded-[3rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <TrendingUp className="h-32 w-32 text-text-tertiary" />
               </div>
               <div className="flex items-center justify-between mb-12">
                  <div className="space-y-1">
                     <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase">Academic Performance</h3>
                     <p className="text-sm font-bold text-text-tertiary">Historical result analytics across all departments</p>
                  </div>
                  <Select 
                    options={[{ label: 'Current Term', value: '1' }, { label: 'Last Term', value: '2' }]} 
                    className="w-48 bg-bg-tertiary border-none h-11"
                  />
               </div>

               <div className="h-80 w-full flex items-end justify-between gap-4 px-4">
                  {[65, 45, 85, 70, 90, 55, 75, 95, 60, 80].map((h, i) => (
                    <div key={i} className="flex-1 group relative">
                       <div 
                         className="w-full bg-accent/10 group-hover:bg-accent/20 rounded-2xl transition-all duration-500 relative"
                         style={{ height: `${h}%` }}
                       >
                          <div className="absolute inset-x-0 bottom-0 bg-accent rounded-2xl h-1/3 group-hover:h-full transition-all duration-700 shadow-lg shadow-accent/20" />
                       </div>
                       <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-text-tertiary uppercase tracking-tighter">
                         Cls {i+1}
                       </p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Detailed Monitoring Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <MonitorSection 
                 title="Attendance Logs" 
                 icon={ShieldCheck} 
                 color="text-emerald-500"
                 items={[
                   { label: 'Today\'s Attendance', val: stats.attendanceToday, link: '/admin/attendance' },
                   { label: 'Absence Rate', val: `${100 - stats.attendanceRate}%`, link: '/admin/attendance' },
                   { label: 'Pending Approvals', val: '0', link: '/admin/attendance' }
                 ]}
               />
               <MonitorSection 
                 title="Academic Output" 
                 icon={ClipboardList} 
                 color="text-purple-500"
                 items={[
                   { label: 'Assignments Live', val: stats.pendingAssignments, link: '/admin/assignments' },
                   { label: 'Exams Scheduled', val: stats.examCount, link: '/admin/exams' },
                   { label: 'Results Pending', val: '4', link: '/admin/results' }
                 ]}
               />
            </div>
         </div>

         {/* Right Panel: Action Center & Logs */}
         <div className="space-y-8">
            <div className="glass-card p-8 bg-white border-none shadow-xl rounded-[2.5rem] relative overflow-hidden">
               <div className="absolute top-0 left-0 w-2 h-full bg-accent" />
               <h3 className="text-lg font-black text-text-primary tracking-tight uppercase mb-6 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-accent" />
                  Quick Controls
               </h3>
               <div className="grid grid-cols-1 gap-4">
                  <ActionButton icon={Search} label="Global Search" color="bg-bg-tertiary" />
                  <ActionButton icon={FileText} label="Generate Report" color="bg-bg-tertiary" />
                  <ActionButton icon={Users} label="Student List" color="bg-emerald-50" textColor="text-emerald-700" link="/admin/students" />
                  <ActionButton icon={GraduationCap} label="Faculty Panel" color="bg-purple-50" textColor="text-purple-700" link="/admin/teachers" />
               </div>
            </div>

            <div className="glass-card p-8 bg-white border-none shadow-xl rounded-[2.5rem] flex-1">
               <h3 className="text-lg font-black text-text-primary tracking-tight uppercase mb-6">Recent System Logs</h3>
               <div className="space-y-6">
                  {recentActivity.map((log, i) => (
                    <div key={i} className="flex gap-4 group">
                       <div className="h-10 w-10 rounded-xl bg-bg-tertiary flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                          <Activity className="h-5 w-5 text-text-tertiary group-hover:text-accent" />
                       </div>
                       <div>
                          <p className="text-xs font-black text-text-primary leading-tight mb-1">{log.title}</p>
                          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                            {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color, bg }: any) {
  return (
    <div className={cn("p-8 rounded-[2.5rem] border-none shadow-lg shadow-black/[0.02] flex flex-col justify-between h-48 group hover:-translate-y-1 transition-all duration-300", bg)}>
       <div className="flex items-start justify-between">
          <div className={cn("h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm", color)}>
             <Icon className="h-6 w-6" />
          </div>
          <ArrowUpRight className="h-5 w-5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
       </div>
       <div>
          <p className="text-3xl font-black text-text-primary tracking-tighter">{value}</p>
          <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">{title}</p>
          <p className="text-[10px] font-bold text-text-secondary">{subtitle}</p>
       </div>
    </div>
  );
}

function MonitorSection({ title, icon: Icon, items, color }: any) {
  return (
    <div className="glass-card p-8 bg-white border-none shadow-xl rounded-[2.5rem]">
       <div className="flex items-center gap-3 mb-8">
          <div className={cn("h-10 w-10 rounded-xl bg-bg-tertiary flex items-center justify-center", color)}>
             <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-black text-text-primary tracking-tight uppercase">{title}</h3>
       </div>
       <div className="space-y-4">
          {items.map((item: any, i: number) => (
            <Link 
              key={i} 
              href={item.link}
              className="flex items-center justify-between p-4 rounded-2xl bg-bg-tertiary/50 hover:bg-white hover:shadow-md border border-transparent hover:border-border/50 transition-all group"
            >
               <span className="text-xs font-black text-text-tertiary uppercase tracking-widest group-hover:text-text-primary">{item.label}</span>
               <span className="text-sm font-black text-text-primary">{item.val}</span>
            </Link>
          ))}
       </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, color, textColor = "text-text-primary", link = "#" }: any) {
  return (
    <Link 
      href={link}
      className={cn("flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-border/50 hover:shadow-md transition-all group", color)}
    >
       <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          <Icon className="h-5 w-5 text-text-secondary" />
       </div>
       <span className={cn("text-xs font-black uppercase tracking-widest", textColor)}>{label}</span>
    </Link>
  );
}

import { Select } from '@/app/_components/ui/select';
