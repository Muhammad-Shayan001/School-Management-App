'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNotificationStore } from '@/app/_lib/store/notification-store';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import Link from 'next/link';
import { formatRelativeTime } from '@/app/_lib/utils/format';
import { cn } from '@/app/_lib/utils/cn';
import { Bell, Check, CheckCheck } from 'lucide-react';

/**
 * Notification bell icon with unread count badge and dropdown panel.
 * Fetches notifications via API routes (which use adminClient to bypass RLS).
 * Polls every 15 seconds for live updates.
 */
export function NotificationBell() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isOpen,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    togglePanel,
    setOpen,
  } = useNotificationStore();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications via API route (bypasses RLS)
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications/attendance?limit=20&offset=0', {
        cache: 'no-store',
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data) setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [user, setNotifications]);

  // Fetch initial notifications and set up polling
  useEffect(() => {
    if (!user) return;

    // Fetch immediately
    fetchNotifications();

    // Poll every 15 seconds for new notifications
    pollIntervalRef.current = setInterval(fetchNotifications, 15000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [user, fetchNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setOpen]);

  // Handle mark as read via API route
  async function handleMarkAsRead(id: string) {
    markAsRead(id);
    try {
      await fetch(`/api/notifications/attendance/${id}`, { method: 'PUT' });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  // Handle mark all as read via API route
  async function handleMarkAllAsRead() {
    if (!user) return;
    markAllAsRead();
    try {
      await fetch('/api/notifications/attendance/mark-all-read', { method: 'PUT' });
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={togglePanel}
        className="relative p-2.5 rounded-xl text-text-secondary hover:text-accent hover:bg-accent-subtle/50 transition-all duration-300 active:scale-95 group"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-danger text-[9px] font-black text-white ring-2 ring-bg-secondary animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-[400px] bg-white border border-border/50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden rounded-3xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-accent text-[9px] font-black text-white uppercase">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent-hover transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[450px] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-20 text-center px-8">
                <div className="h-16 w-16 bg-bg-tertiary/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/30 shadow-inner">
                  <Bell className="h-8 w-8 text-text-tertiary opacity-30" />
                </div>
                <p className="text-sm font-black text-text-primary mb-1 uppercase tracking-tight">All caught up!</p>
                <p className="text-xs font-bold text-text-tertiary">No new notifications for you right now.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-4 px-6 py-4 border-b border-gray-100 hover:bg-blue-50 transition-all duration-300 cursor-pointer relative group',
                    !n.is_read ? 'bg-blue-50/60' : 'bg-white'
                  )}
                  onClick={() => handleMarkAsRead(n.id)}
                >
                  {!n.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                  )}
                  
                  {/* Icon */}
                  <div className="mt-1 flex-shrink-0">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center border transition-colors",
                      !n.is_read ? "bg-white border-blue-200 text-blue-600 shadow-sm" : "bg-gray-100 border-gray-200 text-gray-400"
                    )}>
                      <Bell className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={cn(
                        "text-[13px] tracking-tight truncate",
                        !n.is_read ? "font-black text-text-primary" : "font-bold text-text-secondary"
                      )}>
                        {n.title}
                      </p>
                      <p className="text-[9px] font-black text-text-tertiary uppercase tracking-tighter flex-shrink-0">
                        {formatRelativeTime(n.created_at)}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-text-tertiary line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 text-center border-t border-gray-100">
              <Link href="/student/notifications" onClick={() => setOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-accent transition-colors block w-full">
                View All Activity
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
