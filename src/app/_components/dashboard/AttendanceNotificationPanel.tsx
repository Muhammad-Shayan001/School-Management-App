'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatRelativeTime } from '@/app/_lib/utils/format';
import { cn } from '@/app/_lib/utils/cn';
import { CheckCheck, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { Notification } from '@/app/_lib/types/database';

interface AttendanceNotificationPanelProps {
  className?: string;
  maxHeight?: string;
}

/**
 * Attendance Notification Panel Component
 * Displays attendance notifications with read/unread status management
 * Fetches via API routes (which use adminClient to bypass RLS)
 */
export function AttendanceNotificationPanel({
  className = '',
  maxHeight = 'max-h-[600px]',
}: AttendanceNotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications via API route (bypasses RLS)
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        '/api/notifications/attendance?limit=50&offset=0',
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const { data } = await response.json();
      setNotifications(data || []);

      // Calculate unread count
      const unread = (data || []).filter((n: Notification) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial notifications and poll every 15 seconds
  useEffect(() => {
    fetchNotifications();

    // Poll every 15 seconds for new notifications
    const interval = setInterval(fetchNotifications, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    try {
      const response = await fetch(`/api/notifications/attendance/${id}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch('/api/notifications/attendance/mark-all-read', {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all as read:', err);
    }
  }

  async function deleteNotification(id: string) {
    try {
      const response = await fetch(`/api/notifications/attendance/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
    }
  }

  const getStatusIcon = (status?: string | null) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'absent':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'late':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-text-tertiary" />;
    }
  };

  return (
    <div className={cn('flex flex-col bg-white border border-border/50 rounded-2xl', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-bg-tertiary/20">
        <div>
          <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
            Attendance Notifications
          </h3>
          {unreadCount > 0 && (
            <p className="text-xs font-medium text-text-tertiary mt-1">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent-hover transition-colors px-3 py-1.5 rounded-lg hover:bg-accent/10"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className={cn('overflow-y-auto overscroll-contain', maxHeight)}>
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs font-medium text-text-tertiary">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="py-12 px-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-black text-text-primary mb-1 uppercase">Error</p>
            <p className="text-xs text-text-tertiary">{error}</p>
            <button
              onClick={fetchNotifications}
              className="mt-4 text-xs font-black text-accent hover:text-accent-hover uppercase tracking-widest"
            >
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center px-6">
            <div className="h-16 w-16 bg-bg-tertiary/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/30 shadow-inner">
              <CheckCircle className="h-8 w-8 text-emerald-500 opacity-30" />
            </div>
            <p className="text-sm font-black text-text-primary mb-1 uppercase tracking-tight">
              All caught up!
            </p>
            <p className="text-xs font-medium text-text-tertiary">
              No attendance notifications yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-4 px-6 py-4 hover:bg-bg-tertiary/30 transition-all duration-300 group relative',
                  !notification.is_read && 'bg-accent/5'
                )}
              >
                {!notification.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                )}

                {/* Status Icon */}
                <div className="mt-1 flex-shrink-0">
                  {getStatusIcon(notification.attendance_status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={cn(
                      'text-[13px] tracking-tight truncate',
                      !notification.is_read
                        ? 'font-black text-text-primary'
                        : 'font-bold text-text-secondary'
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-tighter flex-shrink-0 whitespace-nowrap ml-2">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-text-tertiary line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1.5 hover:bg-accent/10 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck className="h-4 w-4 text-accent" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
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

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-6 py-3 bg-bg-tertiary/20 text-center border-t border-border/30">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
          </p>
        </div>
      )}
    </div>
  );
}
