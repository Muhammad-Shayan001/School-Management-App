'use client';

import { 
  Users, GraduationCap, School, Layers, CheckCircle, 
  XCircle, FileText, CreditCard, ClipboardList, Megaphone,
  ArrowUpRight, TrendingUp, Activity, Search, Filter,
  MoreVertical, Eye, Download, Printer, UserPlus, ChevronRight, Clock
} from 'lucide-react';
import { StatsCard } from './stats-card';
import { Badge } from '@/app/_components/ui/badge';
import { cn } from '@/app/_lib/utils/cn';
import Link from 'next/link';

interface MonitoringOverviewProps {
  stats: any;
  recentActivity: any[];
}

export function MonitoringOverview({ stats, recentActivity }: MonitoringOverviewProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-1000">
      {/* Analytics Summary - Ultra Modern Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          variant="success"
          subtitle="Registered & Active"
          className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 transition-all duration-500 rounded-[2.5rem]"
        />
        <StatsCard
          title="Total Teachers"
          value={stats.totalTeachers}
          icon={GraduationCap}
          variant="accent"
          subtitle="Academic Staff"
          className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 shadow-lg shadow-accent/5 hover:shadow-accent/10 transition-all duration-500 rounded-[2.5rem]"
        />
        <StatsCard
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          icon={Activity}
          variant={stats.attendanceRate > 90 ? "success" : "warning"}
          subtitle={`${stats.attendanceToday} students present`}
          className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 shadow-lg shadow-blue-500/5 hover:shadow-blue-500/10 transition-all duration-500 rounded-[2.5rem]"
        />
        <StatsCard
          title="Revenue Health"
          value={stats.feesPending === 0 ? "100%" : `${Math.max(0, 100 - Math.round((stats.feesPending / stats.totalStudents) * 100))}%`}
          icon={CreditCard}
          variant="danger"
          subtitle="Fee collection status"
          className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20 shadow-lg shadow-rose-500/5 hover:shadow-rose-500/10 transition-all duration-500 rounded-[2.5rem]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Real-time Status Board - Premium Glassmorphism */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-10 bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/[0.03] relative overflow-hidden rounded-[3rem]">
             <div className="absolute -top-24 -right-24 h-64 w-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
             <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
             
             <div className="flex items-center justify-between mb-10 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase leading-none">Institutional Insight</h3>
                  <p className="text-sm font-bold text-text-tertiary mt-2">Intelligence-driven academic monitoring</p>
                </div>
                <div className="flex gap-3">
                   <button className="h-12 w-12 rounded-2xl bg-bg-tertiary/80 backdrop-blur-md flex items-center justify-center hover:bg-white hover:shadow-xl hover:scale-110 transition-all duration-300 group">
                     <Download className="h-5 w-5 text-text-secondary group-hover:text-accent" />
                   </button>
                   <button className="h-12 w-12 rounded-2xl bg-bg-tertiary/80 backdrop-blur-md flex items-center justify-center hover:bg-white hover:shadow-xl hover:scale-110 transition-all duration-300 group">
                     <Printer className="h-5 w-5 text-text-secondary group-hover:text-accent" />
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <StatusMetric 
                  label="Daily Attendance" 
                  value={stats.attendanceToday} 
                  total={stats.totalStudents} 
                  color="emerald" 
                  unit="Students"
                />
                <StatusMetric 
                  label="Absent Today" 
                  value={stats.absentToday} 
                  total={stats.totalStudents} 
                  color="rose" 
                  unit="Records"
                />
                <StatusMetric 
                  label="Academic Pace" 
                  value={stats.examCount} 
                  total={20} 
                  color="amber" 
                  unit="Exams"
                />
             </div>

             <div className="mt-12 pt-12 border-t border-border/40 relative z-10">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-1 bg-accent rounded-full" />
                      <h4 className="text-xs font-black text-text-primary uppercase tracking-[0.2em]">Live Performance Indicators</h4>
                   </div>
                   <Link href="/admin/results" className="text-xs font-black text-accent flex items-center gap-2 group">
                      <span className="group-hover:mr-2 transition-all">DEEP ANALYTICS</span> <ArrowUpRight className="h-4 w-4" />
                   </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                   {[
                     { label: 'Active Classes', val: stats.totalClasses, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                     { label: 'Core Subjects', val: stats.totalSubjects, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                     { label: 'Open Tasks', val: stats.pendingAssignments, icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                     { label: 'Broadcasts', val: stats.announcementCount, icon: Megaphone, color: 'text-cyan-500', bg: 'bg-cyan-500/10' }
                   ].map((kpi, i) => (
                     <div key={i} className="group cursor-default">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500", kpi.bg)}>
                           <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                        </div>
                        <p className="text-2xl font-black text-text-primary tracking-tighter mb-0.5">{kpi.val}</p>
                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest leading-tight">{kpi.label}</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Quick Monitoring Actions - Floating Style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {[
               { label: 'Students', href: '/admin/students', icon: Users, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
               { label: 'Faculty', href: '/admin/teachers', icon: GraduationCap, color: 'bg-accent', shadow: 'shadow-accent/20' },
               { label: 'Card Lab', href: '/admin/id-card', icon: CreditCard, color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
               { label: 'Result Hub', href: '/admin/results', icon: ClipboardList, color: 'bg-purple-500', shadow: 'shadow-purple-500/20' }
             ].map((act, i) => (
               <Link 
                 key={i} 
                 href={act.href}
                 className="group relative h-44 rounded-[2.5rem] bg-white border border-border/50 overflow-hidden flex flex-col items-center justify-center text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
               >
                 <div className="absolute inset-0 bg-gradient-to-br from-white to-bg-tertiary opacity-50" />
                 <div className={cn("relative z-10 h-16 w-16 rounded-2xl flex items-center justify-center mb-4 text-white shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6", act.color, act.shadow)}>
                    <act.icon className="h-7 w-7" />
                 </div>
                 <span className="relative z-10 text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">{act.label}</span>
                 <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    <ChevronRight className="h-4 w-4 text-accent" />
                 </div>
               </Link>
             ))}
          </div>
        </div>

        {/* Activity Timeline - Modern & Slick */}
        <div className="space-y-8">
           <div className="glass-card p-10 bg-white border-none shadow-2xl shadow-black/[0.03] h-full relative overflow-hidden rounded-[3rem]">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                 <Activity className="h-32 w-32" />
              </div>
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-xl font-black text-text-primary tracking-tight uppercase">Live Stream</h3>
                 <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500/40" />
                 </div>
              </div>
              
              <div className="space-y-10 relative">
                 <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-accent/20 via-border/50 to-transparent" />
                 
                 {recentActivity.map((item, i) => (
                   <div key={i} className="relative pl-12 group cursor-default">
                      <div className={cn(
                        "absolute left-2 top-0 h-4.5 w-4.5 rounded-full border-4 border-white shadow-md z-10 transition-all duration-500 group-hover:scale-125",
                        item.type === 'attendance' ? 'bg-emerald-500' : 
                        item.type === 'assignment' ? 'bg-accent' : 'bg-purple-500'
                      )} />
                      <div className="space-y-1">
                        <p className="text-[13px] font-black text-text-primary leading-snug group-hover:text-accent transition-colors">
                           {item.title}
                        </p>
                        <div className="flex items-center gap-2">
                           <Clock className="h-3 w-3 text-text-tertiary" />
                           <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest" suppressHydrationWarning>
                              {new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                           </p>
                            <Badge variant="default" className="text-[8px] px-2 py-0 h-4 bg-bg-tertiary border-none">
                              {item.type}
                           </Badge>
                        </div>
                      </div>
                   </div>
                 ))}

                 {recentActivity.length === 0 && (
                   <div className="py-20 text-center space-y-4">
                      <div className="h-16 w-16 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto opacity-30">
                         <Activity className="h-8 w-8" />
                      </div>
                      <p className="text-xs font-black text-text-tertiary uppercase tracking-widest italic">Monitoring for activity...</p>
                   </div>
                 )}
              </div>

              <div className="mt-12">
                 <button className="w-full py-5 rounded-[2rem] bg-bg-tertiary hover:bg-accent hover:text-white transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:shadow-xl hover:shadow-accent/20">
                    Full System Audit Log
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatusMetric({ label, value, total, color, unit }: any) {
  const colors: any = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 h-full bg-emerald-600',
    rose: 'text-rose-600 bg-rose-50 border-rose-100 h-full bg-rose-600',
    amber: 'text-amber-600 bg-amber-50 border-amber-100 h-full bg-amber-600'
  };

  const percentage = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className={cn("p-8 rounded-[2.5rem] border transition-all duration-500 hover:shadow-xl hover:-translate-y-1", colors[color].split(' h-full ')[0])}>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">{label}</p>
       <div className="flex items-end justify-between mb-5">
          <p className="text-4xl font-black tracking-tighter leading-none">{value}</p>
          <p className="text-[11px] font-black uppercase tracking-widest mb-1 opacity-60">{unit}</p>
       </div>
       <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden p-0.5">
          <div className={cn("rounded-full transition-all duration-1000 ease-out", colors[color].split(' h-full ')[1])} style={{ width: `${percentage}%` }} />
       </div>
    </div>
  );
}


// Re-importing missing Lucide icons for consistency
import { BookOpen } from 'lucide-react';
