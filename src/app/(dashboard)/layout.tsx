import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/app/_lib/actions/auth';
import { getFullProfile } from '@/app/_lib/actions/profile';
import { SIDEBAR_NAV } from '@/app/_lib/utils/constants';
import type { UserRole } from '@/app/_lib/utils/constants';
import { Sidebar } from '@/app/_components/layout/sidebar';
import { Navbar } from '@/app/_components/layout/navbar';
import DashboardShell from '@/app/_components/layout/dashboard-shell';

/**
 * Dashboard shell — contains sidebar + navbar + main content area.
 * Enforces profile completion before allowing access to other dashboard pages.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || ''; // Assuming middleware or similar sets this, or just use a simpler check

  if (!user) {
    redirect('/login');
  }

  // Check profile completion (PART 2 Requirement)
  // We allow access to /profile and /profile/setup to avoid infinite loop
  const isSetupPage = pathname.includes('/profile/setup') || pathname === '/profile';
  
  if (!isSetupPage) {
    const { data: profile } = await getFullProfile();
    
    if (profile) {
      const isTeacherIncomplete = profile.role === 'teacher' && !profile.teacher?.teacher_id;
      const isAdminIncomplete = (profile.role === 'admin' || profile.role === 'super_admin') && !profile.phone;

      if (isTeacherIncomplete || isAdminIncomplete) {
        if (pathname && !pathname.includes('/profile/setup')) {
          redirect('/profile/setup');
        }
      }
      
      const isStudentIncomplete = profile.role === 'student' && (!profile.student || !profile.student.roll_number);
      if (isStudentIncomplete && pathname && pathname !== '/profile') {
        redirect('/profile');
      }
    }
  }
  
  const role = user.role as UserRole;
  const navItems = SIDEBAR_NAV[role] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary text-text-primary">
      {/* Sidebar - Correct role passed from server */}
      <Sidebar navItems={navItems} role={role} />

      {/* Main content area wrapped in client shell for UI state */}
      <DashboardShell>
        {/* Top Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-bg-primary">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </DashboardShell>
    </div>
  );
}
