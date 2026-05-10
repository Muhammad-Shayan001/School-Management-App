'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/app/_lib/utils/cn';
import { useUIStore } from '@/app/_lib/store/ui-store';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { ROLE_LABELS } from '@/app/_lib/utils/constants';
import { logout } from '@/app/_lib/actions/auth';
import type { UserRole } from '@/app/_lib/utils/constants';
import {
  BookOpen,
  ChevronLeft,
  X,
  LayoutDashboard,
  UserCheck,
  School,
  Settings,
  GraduationCap,
  Users,
  Megaphone,
  Calendar,
  ClipboardList,
  MessageSquare,
  UserCog,
  FileText,
  ClipboardCheck,
  BarChart3,
  CreditCard,
  LogOut,
  User,
} from 'lucide-react';

// Icon map for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  UserCheck,
  School,
  Settings,
  GraduationCap,
  Users,
  Megaphone,
  Calendar,
  ClipboardList,
  MessageSquare,
  UserCog,
  FileText,
  ClipboardCheck,
  BarChart3,
  CreditCard,
  User,
};

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  navItems: NavItem[];
  role: UserRole;
}

/**
 * Collapsible sidebar with role-based navigation, active state indicators,
 * and responsive overlay on mobile.
 */
export function Sidebar({ navItems, role }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapse } = useUIStore();
  const { user } = useAuthStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-glass-border bg-bg-secondary',
          'transition-all duration-300 ease-in-out',
          // Mobile: slide in/out
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible
          'lg:translate-x-0',
          // Width
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]',
          'w-[260px]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-glass-border">
          <Link
            href="/"
            className={cn(
              'flex items-center gap-2.5',
              sidebarCollapsed && 'lg:justify-center'
            )}
          >
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span
              className={cn(
                'text-base font-bold text-text-primary tracking-tight',
                sidebarCollapsed && 'lg:hidden'
              )}
            >
              SchoolMS
            </span>
          </Link>

          {/* Close button (mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-glass-hover transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Collapse button (desktop) */}
          <button
            onClick={toggleSidebarCollapse}
            className={cn(
              'hidden lg:flex p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-glass-hover transition-colors',
              sidebarCollapsed && 'lg:hidden'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Role badge */}
        <div
          className={cn(
            'mx-4 mt-6 mb-4 px-4 py-2 rounded-2xl bg-accent/5 border border-accent/10 flex items-center gap-2.5 shadow-inner transition-all duration-300',
            sidebarCollapsed && 'lg:mx-3 lg:px-0 lg:justify-center'
          )}
        >
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span
            className={cn(
              'text-[10px] font-black text-accent uppercase tracking-[0.15em] leading-none',
              sidebarCollapsed && 'lg:hidden'
            )}
          >
            {ROLE_LABELS[role]}
          </span>
          <span className={cn('hidden text-[10px] font-black text-accent uppercase tracking-widest', sidebarCollapsed && 'lg:block')}>
            {ROLE_LABELS[role]?.charAt(0)}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2 overscroll-contain">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href + '/'));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-500 group relative',
                  sidebarCollapsed && 'lg:justify-center lg:px-0',
                  isActive
                    ? 'bg-accent text-white shadow-xl shadow-accent/30 translate-x-1.5'
                    : 'text-text-secondary hover:text-accent hover:bg-accent-subtle/50 hover:translate-x-1.5'
                )}
              >
                <div className="flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-text-tertiary group-hover:text-accent")} />
                </div>
                <span className={cn(
                  'leading-none whitespace-nowrap transition-all duration-500', 
                  sidebarCollapsed && 'lg:hidden lg:opacity-0 lg:scale-0'
                )}>
                  {item.label}
                </span>
                {isActive && !sidebarCollapsed && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom - User info & Logout */}
        {user && (
          <div className="mt-auto border-t border-glass-border/30 bg-bg-tertiary/20 backdrop-blur-xl p-4">
            {/* User profile info */}
            <div
              className={cn(
                'mb-4 flex items-center gap-3 p-3 rounded-2xl bg-white border border-border/30 shadow-sm transition-all duration-300',
                sidebarCollapsed && 'justify-center p-2'
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-accent text-white flex items-center justify-center flex-shrink-0 text-sm font-black shadow-lg shadow-accent/20 border border-white/20">
                {user.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || '?'}
              </div>
              <div className={cn('min-w-0 flex-1', sidebarCollapsed && 'hidden')}>
                <p className="text-[13px] font-black text-text-primary truncate tracking-tight leading-none mb-1">
                  {user.full_name || 'User'}
                </p>
                <p className="text-[10px] font-bold text-text-tertiary truncate uppercase tracking-tighter opacity-70">{user.email}</p>
              </div>
            </div>

            {/* Explicit Logout Button */}
            <div className={cn('space-y-1', sidebarCollapsed && 'flex justify-center')}>
              <form action={logout} className="w-full">
                <button
                  type="submit"
                  className={cn(
                    'flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500',
                    'text-danger hover:bg-danger-subtle hover:text-danger active:scale-95 group relative overflow-hidden',
                    sidebarCollapsed && 'justify-center w-12 h-12 px-0 rounded-2xl'
                  )}
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0 transition-transform group-hover:-translate-x-1" />
                  <span className={cn(sidebarCollapsed && 'hidden')}>Sign Out</span>
                  
                  {/* Subtle hover effect background */}
                  <div className="absolute inset-0 bg-danger/0 group-hover:bg-danger/5 transition-colors duration-500 -z-10" />
                </button>
              </form>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
