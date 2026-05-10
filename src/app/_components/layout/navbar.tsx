'use client';

import { useUIStore } from '@/app/_lib/store/ui-store';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { NotificationBell } from '@/app/_components/layout/notification-bell';
import { ProfileDropdown } from '@/app/_components/layout/profile-dropdown';
import { Menu, Search, LogOut } from 'lucide-react';
import { logout } from '@/app/_lib/actions/auth';
import { cn } from '@/app/_lib/utils/cn';

/**
 * Top navigation bar with hamburger menu, search, notifications, and profile dropdown.
 */
export function Navbar() {
  const { toggleSidebar, sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 border-b border-glass-border bg-bg-secondary/80 backdrop-blur-xl">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-text-secondary hover:text-accent hover:bg-accent-subtle/50 transition-all duration-300 lg:hidden active:scale-95"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex p-2 rounded-xl text-text-secondary hover:text-accent hover:bg-accent-subtle/50 transition-all duration-300 active:scale-95"
          aria-label="Collapse sidebar"
        >
          <Menu className={cn("h-6 w-6 transition-transform duration-500", sidebarCollapsed && "rotate-180")} />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-bg-tertiary/50 border border-border/50 text-text-tertiary w-72 transition-all duration-300 focus-within:border-accent/40 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-accent/5">
          <Search className="h-4 w-4 flex-shrink-0 opacity-60" />
          <input
            type="text"
            placeholder="Search school records..."
            className="bg-transparent text-[13px] font-bold text-text-primary placeholder:text-text-tertiary outline-none w-full leading-none"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <ProfileDropdown />
        </div>
        
        {/* Direct Logout Button in Navbar */}
        <div className="h-6 w-px bg-glass-border mx-2 hidden sm:block" />
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2.5 px-4 py-2 rounded-2xl text-text-secondary hover:text-danger hover:bg-danger-subtle transition-all duration-300 active:scale-95"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}
