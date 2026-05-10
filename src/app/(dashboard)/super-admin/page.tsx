import Link from 'next/link';
import { getUserStats } from '@/app/_lib/actions/users';
import { getSchoolCount } from '@/app/_lib/actions/schools';
import { StatsCard } from '@/app/_components/dashboard/stats-card';
import { Users, School, UserCheck, Clock } from 'lucide-react';

export default async function SuperAdminDashboard() {
  const stats = await getUserStats();
  const schoolCount = await getSchoolCount();

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Super Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of the entire school management system
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        <StatsCard
          title="Total Users"
          value={stats.total}
          icon={Users}
          variant="accent"
          subtitle="All registered users"
        />
        <StatsCard
          title="Schools"
          value={schoolCount}
          icon={School}
          variant="success"
          subtitle="Registered schools"
        />
        <StatsCard
          title="Pending Approvals"
          value={stats.pending}
          icon={Clock}
          variant="warning"
          subtitle="Awaiting review"
        />
        <StatsCard
          title="Teachers"
          value={stats.teachers}
          icon={UserCheck}
          variant="default"
          subtitle={`${stats.students} students`}
        />
      </div>

      {/* Quick summary cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* User breakdown */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-text-primary mb-4">
            User Breakdown
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Admins (Principals)', count: stats.admins, color: 'bg-accent' },
              { label: 'Teachers', count: stats.teachers, color: 'bg-success' },
              { label: 'Students', count: stats.students, color: 'bg-info' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="text-sm text-text-secondary">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          {/* Visual bar */}
          {stats.total > 0 && (
            <div className="mt-5 flex h-2.5 rounded-full overflow-hidden bg-bg-tertiary">
              <div
                className="bg-accent transition-all duration-500"
                style={{ width: `${(stats.admins / stats.total) * 100}%` }}
              />
              <div
                className="bg-success transition-all duration-500"
                style={{ width: `${(stats.teachers / stats.total) * 100}%` }}
              />
              <div
                className="bg-info transition-all duration-500"
                style={{ width: `${(stats.students / stats.total) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-text-primary mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Review Approvals', href: '/super-admin/approvals', icon: '⏳', count: stats.pending },
              { label: 'Manage Schools', href: '/super-admin/schools', icon: '🏫', count: schoolCount },
              { label: 'View Teachers', href: '/super-admin/approvals?role=teacher', icon: '👨‍🏫', count: stats.teachers },
              { label: 'View Students', href: '/super-admin/approvals?role=student', icon: '🎓', count: stats.students },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-bg-tertiary hover:bg-bg-elevated border border-transparent hover:border-border-hover transition-all duration-200 text-center group"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                  {action.label}
                </span>
                <span className="text-lg font-bold text-text-primary">
                  {action.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
