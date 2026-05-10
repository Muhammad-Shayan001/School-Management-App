'use client';

import { useUIStore } from '@/app/_lib/store/ui-store';
import { cn } from '@/app/_lib/utils/cn';

/**
 * Client-side wrapper for the dashboard main area to handle sidebar collapse state.
 */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div
      className={cn(
        'flex flex-1 flex-col overflow-hidden transition-all duration-300',
        sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
      )}
    >
      {children}
    </div>
  );
}
