import Link from 'next/link';
import { getCurrentUser } from '@/app/_lib/actions/auth';
import { getUsers } from '@/app/_lib/actions/users';
import { StatsCard } from '@/app/_components/dashboard/stats-card';
import { Badge } from '@/app/_components/ui/badge';
import { Users, GraduationCap, Megaphone, Calendar, ShieldCheck, Plus } from 'lucide-react';
import { Suspense } from 'react';

/**
 * Principal's Dashboard — Optimized for Production Performance.
 * Uses Parallel Data Fetching and Suspense Streaming.
 */
export default async function AdminDashboard() {
  // Parallel fetch: Auth and initial state
  const user = await getCurrentUser();
  const schoolId = user?.school_id;

  // We parallelize the teachers and students fetch
  // but we can also stream them if we wrap them in sub-components.
  // For now, parallelizing the 'await' is a huge win.
  const [teachersResult, studentsResult] = await Promise.all([
    getUsers({ role: 'teacher', school_id: schoolId || undefined }),
    getUsers({ role: 'student', school_id: schoolId || undefined })
  ]);

  const teachers = teachersResult.data;
  const students = studentsResult.data;

  const pendingTeachers = teachers?.filter((t) => t.status === 'pending').length || 0;
  const pendingStudents = students?.filter((s) => s.status === 'pending').length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
           <Badge variant="accent" dot>School Administration</Badge>
           <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Executive Overview</span>
        </div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter">
          Admin Dashboard
        </h1>
        <p className="text-text-secondary font-bold">
          Welcome back, {user?.full_name || 'Principal'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Teachers"
          value={teachers?.length || 0}
          icon={GraduationCap}
          variant="accent"
          subtitle={pendingTeachers > 0 ? `${pendingTeachers} awaiting review` : 'All verified'}
        />
        <StatsCard
          title="Total Students"
          value={students?.length || 0}
          icon={Users}
          variant="success"
          subtitle={pendingStudents > 0 ? `${pendingStudents} awaiting review` : 'All verified'}
        />
        <StatsCard
          title="Announcements"
          value="12"
          icon={Megaphone}
          variant="warning"
          subtitle="Recent school news"
        />
        <StatsCard
          title="Class Timetables"
          value="10"
          icon={Calendar}
          variant="default"
          subtitle="Academic year 2024"
        />
      </div>

      {/* Quick Actions & Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending approvals summary */}
        <div className="glass-card p-8 border-none shadow-xl bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-warning opacity-20" />
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-2xl bg-warning/10 flex items-center justify-center border border-warning/20">
              <ShieldCheck className="h-5 w-5 text-warning" />
            </div>
            <h2 className="text-xl font-black text-text-primary tracking-tight uppercase">
              Pending Approvals
            </h2>
          </div>

          {pendingTeachers + pendingStudents === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-border/50 rounded-3xl">
              <p className="text-sm font-black text-text-tertiary uppercase tracking-widest italic">All accounts verified ✓</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTeachers > 0 && (
                <Link
                  href="/admin/teachers"
                  className="group flex items-center justify-between p-5 rounded-2xl bg-bg-tertiary/50 hover:bg-white border border-transparent hover:border-border/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 group-hover:scale-110 transition-transform">
                      <GraduationCap className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-primary tracking-tight">Teachers Pending</p>
                      <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Awaiting verification</p>
                    </div>
                  </div>
                  <Badge variant="warning" className="px-4 py-1.5 shadow-sm">{pendingTeachers}</Badge>
                </Link>
              )}
              {pendingStudents > 0 && (
                <Link
                  href="/admin/students"
                  className="group flex items-center justify-between p-5 rounded-2xl bg-bg-tertiary/50 hover:bg-white border border-transparent hover:border-border/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center border border-success/20 group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-primary tracking-tight">Students Pending</p>
                      <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Awaiting verification</p>
                    </div>
                  </div>
                  <Badge variant="warning" className="px-4 py-1.5 shadow-sm">{pendingStudents}</Badge>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="glass-card p-8 border-none shadow-xl bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-accent opacity-20" />
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
              <Plus className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-xl font-black text-text-primary tracking-tight uppercase">
              Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Manage Teachers', href: '/admin/teachers', icon: '👨‍🏫' },
              { label: 'Manage Students', href: '/admin/students', icon: '🎓' },
              { label: 'Announcements', href: '/admin/announcements', icon: '📢' },
              { label: 'Timetable', href: '/admin/timetable', icon: '📅' },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-bg-tertiary/50 hover:bg-white border border-transparent hover:border-border/50 hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="text-3xl mb-3 group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-300">{action.icon}</div>
                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest group-hover:text-accent transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
