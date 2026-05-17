import { getCurrentUser } from '@/app/_lib/actions/auth';
import { getAdminAnalytics, getRecentActivity } from '@/app/_lib/actions/monitoring';
import { MonitoringOverview } from '@/app/_components/dashboard/monitoring-overview';
import { Badge } from '@/app/_components/ui/badge';

/**
 * Principal's Dashboard — Professional Monitoring & ERP System.
 */
export default async function AdminDashboard() {
  const user = await getCurrentUser();
  const schoolId = user?.school_id;

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">No Campus Associated</h2>
        <p className="text-text-secondary font-medium">Please contact the super admin to assign you to a campus.</p>
      </div>
    );
  }

  // Parallel fetch: Analytics and Activity logs
  const [stats, recentActivity] = await Promise.all([
    getAdminAnalytics(schoolId),
    getRecentActivity(schoolId)
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="accent" dot>Master Admin Panel</Badge>
             <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Enterprise Monitoring</span>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter leading-none">
            Welcome, {user?.full_name?.split(' ')[0] || 'Principal'}
          </h1>
          <p className="text-text-secondary font-bold">
            Here's the real-time status of your campus today.
          </p>
        </div>
        
        <div className="flex gap-3">
           <div className="hidden lg:block text-right">
              <p className="text-xs font-black text-text-tertiary uppercase tracking-widest mb-1">Current Date</p>
              <p className="text-sm font-black text-text-primary">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
           </div>
        </div>
      </div>

      {/* Main Monitoring Interface */}
      <MonitoringOverview stats={stats} recentActivity={recentActivity} />
    </div>
  );
}
