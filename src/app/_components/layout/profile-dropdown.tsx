'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { logout } from '@/app/_lib/actions/auth';
import { ROLE_LABELS, DASHBOARD_ROUTES } from '@/app/_lib/utils/constants';
import type { UserRole } from '@/app/_lib/utils/constants';
import { Avatar } from '@/app/_components/ui/avatar';
import { cn } from '@/app/_lib/utils/cn';
import { LogOut, Settings, User } from 'lucide-react';

/**
 * Profile dropdown in the navbar with user info, settings link, and logout.
 */
export function ProfileDropdown() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const role = user.role as UserRole;
  const settingsHref = `${DASHBOARD_ROUTES[role]}/settings`;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-glass-hover transition-colors"
      >
        <Avatar
          src={user.avatar_url}
          name={user.full_name || 'User'}
          size="sm"
        />
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-text-primary leading-tight truncate max-w-[120px]">
            {user.full_name || 'User'}
          </p>
          <p className="text-[10px] text-text-tertiary leading-tight">
            {ROLE_LABELS[role]}
          </p>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 glass-card bg-bg-secondary border border-glass-border shadow-2xl animate-slide-in-up overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-glass-border">
            <p className="text-sm font-medium text-text-primary truncate">
              {user.full_name}
            </p>
            <p className="text-xs text-text-tertiary truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/profile');
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-glass-hover transition-colors"
            >
              <User className="h-4 w-4" />
              My Profile
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push(DASHBOARD_ROUTES[role]);
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-glass-hover transition-colors"
            >
              <Settings className="h-4 w-4" />
              Dashboard
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-glass-border py-1">
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-danger hover:bg-danger-subtle transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
