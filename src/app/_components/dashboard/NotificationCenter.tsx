'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatRelativeTime } from '@/app/_lib/utils/format';
import { cn } from '@/app/_lib/utils/cn';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  CheckCheck,
  ArrowDown,
  Filter,
  BookOpen,
  Trophy,
  Megaphone,
  Settings,
  User,
  Calendar,
  CreditCard,
  Search,
} from 'lucide-react';
import type { Notification } from '@/app/_lib/types/database';
import { toast } from 'sonner';

type SortBy = 'newest' | 'oldest' | 'unread';
type StatusFilter = 'all' | 'unread' | 'read';
type TypeFilter = 'all' | 'attendance' | 'assignment' | 'result' | 'announcement' | 'system' | 'fee' | 'holiday';

export function NotificationCenter({ title = 'Notification Center' }: { title?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/notifications?limit=250&offset=0', {
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
  }, []);

  // Fetch initial notifications and poll every 10 seconds for real-time updates
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function handleMarkAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PUT' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true, read_status: true } : n))
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success('Notification deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const res = await fetch('/api/notifications', { method: 'PUT' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_status: true })));
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  // Filter and Sort Processing
  let processed = [...notifications];

  // 1. Search Query Filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    processed = processed.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
    );
  }

  // 2. Read Status Filter
  if (statusFilter === 'unread') {
    processed = processed.filter((n) => !n.is_read);
  } else if (statusFilter === 'read') {
    processed = processed.filter((n) => n.is_read);
  }

  // 3. Type Filter
  if (typeFilter !== 'all') {
    processed = processed.filter((n) => n.type === typeFilter);
  }

  // 4. Sorting
  if (sortBy === 'oldest') {
    processed.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (sortBy === 'unread') {
    processed.sort((a, b) => {
      if (a.is_read === b.is_read) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.is_read ? 1 : -1;
    });
  } else {
    // newest (default)
    processed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIconDetails = (type: string) => {
    switch (type) {
      case 'attendance':
        return {
          icon: <Calendar className="h-5 w-5" />,
          bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        };
      case 'assignment':
        return {
          icon: <BookOpen className="h-5 w-5" />,
          bgColor: 'bg-blue-50 text-blue-600 border-blue-100',
        };
      case 'result':
        return {
          icon: <Trophy className="h-5 w-5" />,
          bgColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        };
      case 'announcement':
        return {
          icon: <Megaphone className="h-5 w-5" />,
          bgColor: 'bg-rose-50 text-rose-600 border-rose-100',
        };
      case 'fee':
        return {
          icon: <CreditCard className="h-5 w-5" />,
          bgColor: 'bg-amber-50 text-amber-600 border-amber-100',
        };
      case 'profile':
        return {
          icon: <User className="h-5 w-5" />,
          bgColor: 'bg-violet-50 text-violet-600 border-violet-100',
        };
      case 'system':
      default:
        return {
          icon: <Settings className="h-5 w-5" />,
          bgColor: 'bg-gray-50 text-gray-600 border-gray-100',
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase">
            {title}
          </h1>
          <p className="mt-1 text-xs font-bold text-text-tertiary uppercase tracking-widest opacity-60">
            Manage and view system alerts • {unreadCount} unread • {notifications.length} total
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent/10 hover:bg-accent/15 text-accent rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 self-start md:self-auto active:scale-95 shadow-sm border border-accent/10"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filtering and Search Controls */}
      <div className="glass-card p-6 bg-white border border-border/40 shadow-2xl rounded-[2rem] space-y-6">
        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-4.5 w-4.5 text-text-tertiary opacity-50" />
          <input
            type="text"
            placeholder="Search notification messages, titles, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-bg-tertiary border border-border/30 rounded-2xl text-[13px] font-bold text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent focus:bg-white focus:shadow-lg focus:shadow-accent/5 transition-all duration-300"
          />
        </div>

        <div className="h-px bg-gray-100" />

        {/* Filters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Read Status Filter */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary opacity-60 block">
              Read Status
            </span>
            <div className="flex flex-wrap gap-2">
              {(['all', 'unread', 'read'] as StatusFilter[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setStatusFilter(option)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border active:scale-95',
                    statusFilter === option
                      ? 'bg-accent text-white border-accent shadow-md shadow-accent/15'
                      : 'bg-bg-tertiary text-text-secondary border-transparent hover:bg-bg-secondary'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-2 lg:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary opacity-60 block">
              Category
            </span>
            <div className="flex flex-wrap gap-2">
              {(['all', 'attendance', 'assignment', 'result', 'announcement', 'fee', 'holiday', 'system'] as TypeFilter[]).map(
                (option) => (
                  <button
                    key={option}
                    onClick={() => setTypeFilter(option)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border active:scale-95',
                      typeFilter === option
                        ? 'bg-accent text-white border-accent shadow-md shadow-accent/15'
                        : 'bg-bg-tertiary text-text-secondary border-transparent hover:bg-bg-secondary'
                    )}
                  >
                    {option}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Sort & Stats */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary opacity-60">
              Sort By:
            </span>
            {(['newest', 'oldest', 'unread'] as SortBy[]).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300',
                  sortBy === option
                    ? 'bg-text-primary text-white shadow-sm'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary opacity-45">
            Showing {processed.length} of {notifications.length} alerts
          </span>
        </div>
      </div>

      {/* Notifications Listing */}
      <div className="glass-card bg-white border border-border/40 shadow-2xl rounded-[2rem] overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin h-10 w-10 border-[3px] border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-xs font-black text-text-primary uppercase tracking-wider opacity-60">
              Fetching records from database...
            </p>
          </div>
        ) : error ? (
          <div className="py-20 px-6 text-center">
            <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4 opacity-40" />
            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight mb-2">Failed to load</h3>
            <p className="text-xs text-text-tertiary font-medium mb-6">{error}</p>
            <button
              onClick={fetchNotifications}
              className="px-5 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent-hover shadow-md active:scale-95 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : processed.length === 0 ? (
          <div className="py-24 text-center px-6">
            <div className="h-16 w-16 bg-bg-tertiary/50 rounded-[1.25rem] flex items-center justify-center mx-auto mb-4 border border-border/20 shadow-inner">
              <Bell className="h-7 w-7 text-text-tertiary opacity-30" />
            </div>
            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight mb-1">
              All caught up!
            </h3>
            <p className="text-xs font-bold text-text-tertiary">
              {searchQuery
                ? 'No alerts match your search filters.'
                : 'You have no notifications in this category.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {processed.map((notif) => {
              const details = getNotificationIconDetails(notif.type);
              return (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-4 p-6 hover:bg-bg-tertiary/20 transition-all duration-300 relative group',
                    !notif.is_read && 'bg-blue-50/20'
                  )}
                >
                  {/* Left accent bar for unread */}
                  {!notif.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                  )}

                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center border shadow-sm', details.bgColor)}>
                      {details.icon}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <h4
                          className={cn(
                            'text-sm tracking-tight leading-snug',
                            !notif.is_read ? 'font-black text-text-primary' : 'font-bold text-text-secondary'
                          )}
                        >
                          {notif.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black text-text-tertiary uppercase tracking-wider px-2 py-0.5 rounded bg-bg-tertiary border border-border/30">
                            {notif.type}
                          </span>
                          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-tighter flex items-center gap-1">
                            <Clock className="h-3 w-3 opacity-60" />
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      {!notif.is_read && (
                        <span className="px-2 py-0.5 bg-accent text-[9px] font-black text-white uppercase tracking-widest rounded-md shrink-0">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-text-tertiary mt-2 leading-relaxed">
                      {notif.message}
                    </p>
                    
                    {/* Inline Redirect Link */}
                    {notif.link && (
                      <a
                        href={notif.link}
                        className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-accent hover:text-accent-hover mt-3.5 transition-colors"
                      >
                        Action required &rarr;
                      </a>
                    )}
                  </div>

                  {/* Side Actions (Hover triggers) */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 self-center">
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-2.5 bg-accent/5 hover:bg-accent/15 text-accent rounded-xl active:scale-95 transition-all duration-300"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl active:scale-95 transition-all duration-300"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
