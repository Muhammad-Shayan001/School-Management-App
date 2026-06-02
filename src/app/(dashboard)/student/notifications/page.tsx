'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/_lib/supabase/client';
import { formatRelativeTime } from '@/app/_lib/utils/format';
import { cn } from '@/app/_lib/utils/cn';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  CheckCheck,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';
import type { Notification } from '@/app/_lib/types/database';

type SortBy = 'newest' | 'oldest' | 'unread';
type FilterBy = 'all' | 'unread' | 'read' | 'present' | 'absent' | 'late';

/**
 * Student Attendance Notification History Page
 */
export default function AttendanceNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
    subscribeToUpdates();
  }, []);

  async function fetchNotifications() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/notifications/attendance?limit=200&offset=0', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const { data } = await response.json();
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }

  function subscribeToUpdates() {
    const channel = supabase
      .channel('attendance_notifications_page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: 'type=eq.attendance',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/attendance/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }

  async function deleteNotification(id: string) {
    try {
      await fetch(`/api/notifications/attendance/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/notifications/attendance/mark-all-read', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  // Apply filters and sorting
  let filtered = [...notifications];

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
    );
  }

  // Apply read/unread filter
  if (filterBy === 'unread') {
    filtered = filtered.filter((n) => !n.is_read);
  } else if (filterBy === 'read') {
    filtered = filtered.filter((n) => n.is_read);
  } else if (['present', 'absent', 'late'].includes(filterBy)) {
    filtered = filtered.filter((n) => n.attendance_status === filterBy);
  }

  // Apply sorting
  if (sortBy === 'oldest') {
    filtered.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } else if (sortBy === 'unread') {
    filtered.sort((a, b) => {
      if (a.is_read === b.is_read) {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return a.is_read ? 1 : -1;
    });
  } else {
    // newest (default)
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getStatusIcon = (status?: string | null) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'absent':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'late':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-text-tertiary" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          Attendance Notifications
        </h1>
        <p className="mt-1 text-sm text-text-secondary font-medium">
          {notifications.length} total • {unreadCount} unread
        </p>
      </div>

      {/* Controls Bar */}
      <div className="glass-card p-6 bg-white border-none shadow-xl space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-tertiary border border-border/30 rounded-xl text-sm font-medium placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-text-tertiary flex items-center gap-1.5">
              <Filter className="h-4 w-4" /> Filter:
            </span>
            {(['all', 'unread', 'read', 'present', 'absent', 'late'] as FilterBy[]).map(
              (option) => (
                <button
                  key={option}
                  onClick={() => setFilterBy(option)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                    filterBy === option
                      ? 'bg-accent text-white shadow-lg'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                  )}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-text-tertiary flex items-center gap-1.5">
              <ArrowDown className="h-4 w-4" /> Sort:
            </span>
            {(['newest', 'oldest', 'unread'] as SortBy[]).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                  sortBy === option
                    ? 'bg-accent text-white shadow-lg'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                )}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {unreadCount > 0 && (
          <div className="flex gap-2">
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg text-xs font-black uppercase tracking-widest transition-all inline-flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All as Read
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="glass-card bg-white border-none shadow-xl overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin h-10 w-10 border-3 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm font-black text-text-primary uppercase tracking-tight">
              Loading notifications...
            </p>
          </div>
        ) : error ? (
          <div className="py-20 px-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-black text-text-primary uppercase mb-2">Error</p>
            <p className="text-xs text-text-tertiary mb-6">{error}</p>
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-accent-hover transition-all"
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="h-16 w-16 bg-bg-tertiary/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/30 shadow-inner">
              <CheckCircle className="h-8 w-8 text-emerald-500 opacity-30" />
            </div>
            <p className="text-sm font-black text-text-primary uppercase tracking-tight mb-1">
              No Notifications
            </p>
            <p className="text-xs text-text-tertiary">
              {searchQuery
                ? 'No notifications match your search.'
                : 'You have no attendance notifications yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-4 p-6 hover:bg-bg-tertiary/30 transition-all group',
                  !notification.is_read && 'bg-accent/5'
                )}
              >
                {!notification.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                )}

                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(notification.attendance_status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className={cn(
                        'text-sm tracking-tight truncate',
                        !notification.is_read
                          ? 'font-black text-text-primary'
                          : 'font-bold text-text-secondary'
                      )}>
                        {notification.title}
                      </h3>
                      <p className="text-xs text-text-tertiary font-medium mt-1 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <span className="px-2 py-1 bg-accent text-white text-[9px] font-black uppercase tracking-widest rounded-full flex-shrink-0">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-text-tertiary leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck className="h-4 w-4 text-accent" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {notifications.length > 0 && (
        <div className="text-center text-xs text-text-tertiary font-medium">
          Showing {filtered.length} of {notifications.length} notifications
        </div>
      )}
    </div>
  );
}
