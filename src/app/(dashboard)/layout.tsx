import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/app/_lib/actions/auth';
import { getFullProfile } from '@/app/_lib/actions/profile';
import { SIDEBAR_NAV } from '@/app/_lib/utils/constants';
import type { UserRole } from '@/app/_lib/utils/constants';
import { Sidebar } from '@/app/_components/layout/sidebar';
import { Navbar } from '@/app/_components/layout/navbar';
import DashboardShell from '@/app/_components/layout/dashboard-shell';
import { Suspense } from 'react';

/**
 * Dashboard shell — contains sidebar + navbar + main content area.
 * Optimized for production with parallel fetching and non-blocking Shell.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Parallel fetch for core auth and profile data
  const [user, profileData, headerList] = await Promise.all([
    getCurrentUser(),
    getFullProfile(),
    headers()
  ]);

  if (!user) {
    redirect('/login');
  }

  const pathname = headerList.get('x-pathname') || '';
  const profile = profileData.data;

  // Check profile completion (Non-blocking redirect logic)
  const isSetupPage = pathname.includes('/profile/setup') || pathname === '/profile';
  
  if (!isSetupPage && profile) {
    const isTeacherIncomplete = profile.role === 'teacher' && !profile.teacher?.teacher_id;
    const isAdminIncomplete = (profile.role === 'admin' || profile.role === 'super_admin') && !profile.phone;

    if ((isTeacherIncomplete || isAdminIncomplete) && !pathname.includes('/profile/setup')) {
      redirect('/profile/setup');
    }
    
    const isStudentIncomplete = profile.role === 'student' && (!profile.student || !profile.student.roll_number);
    if (isStudentIncomplete && pathname !== '/profile') {
      redirect('/profile');
    }
  }
  
  const role = user.role as UserRole;
  const navItems = SIDEBAR_NAV[role] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary text-text-primary">
      {/* Sidebar rendered immediately with cached navItems */}
      <Sidebar navItems={navItems} role={role} />

      <DashboardShell>
        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-bg-primary">
          <div className="mx-auto max-w-7xl">
            {/* Suspense boundary for page content to allow Shell to render first */}
            <Suspense fallback={<DashboardLoadingSkeleton />}>
              {children}
            </Suspense>
          </div>
        </main>
      </DashboardShell>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-1/3 bg-bg-tertiary rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-bg-tertiary rounded-3xl" />
        ))}
      </div>
      <div className="h-64 bg-bg-tertiary rounded-3xl" />
    </div>
  );
}
