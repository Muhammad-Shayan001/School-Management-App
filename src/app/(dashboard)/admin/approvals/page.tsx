'use client';

import { useEffect, useState } from 'react';
import { getUsers, approveUser, rejectUser } from '@/app/_lib/actions/users';
import { Badge } from '@/app/_components/ui/badge';
import { Button } from '@/app/_components/ui/button';
import { Avatar } from '@/app/_components/ui/avatar';
import { ROLE_LABELS, STATUS_CONFIG } from '@/app/_lib/utils/constants';
import type { UserRole, UserStatus } from '@/app/_lib/utils/constants';
import type { Profile } from '@/app/_lib/types/database';
import { formatDate } from '@/app/_lib/utils/format';
import { cn } from '@/app/_lib/utils/cn';
import { Check, X, UserCheck, Filter, Users } from 'lucide-react';
import { PageSpinner } from '@/app/_components/ui/spinner';

export default function AdminApprovalsPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch users (Teachers and Students for this school)
  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      const { data } = await getUsers({ 
        status: statusFilter as UserStatus,
      });
      // Filter for teachers and students only for the school admin's view
      const filtered = (data || []).filter(u => u.role === 'teacher' || u.role === 'student');
      setUsers(filtered);
      setIsLoading(false);
    }
    fetchUsers();
  }, [filter]);

  // Handle approve
  async function handleApprove(userId: string) {
    setActionLoading(userId);
    await approveUser(userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'approved' as UserStatus } : u))
    );
    setActionLoading(null);
  }

  // Handle reject
  async function handleReject(userId: string) {
    setActionLoading(userId);
    await rejectUser(userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' as UserStatus } : u))
    );
    setActionLoading(null);
  }

  const filterTabs = [
    { key: 'pending', label: 'Pending', count: users.filter((u) => u.status === 'pending').length },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            School Approvals
          </h1>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            Review and approve registration requests for your campus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-tertiary" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1.5 rounded-2xl bg-bg-tertiary/50 border border-border w-fit shadow-sm">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300',
              filter === tab.key
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'text-text-tertiary hover:text-text-primary hover:bg-white'
            )}
          >
            {tab.label}
            {'count' in tab && tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-warning text-black font-black">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Users list */}
      {isLoading ? (
        <PageSpinner label="Scanning for requests..." />
      ) : users.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-[2.5rem]">
          <div className="h-16 w-16 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4 border border-border/30">
            <UserCheck className="h-8 w-8 text-text-tertiary opacity-50" />
          </div>
          <p className="text-text-primary font-black uppercase tracking-widest text-sm">Clear Horizon</p>
          <p className="text-xs text-text-tertiary mt-1 font-bold">
            {filter === 'pending' ? 'No new approval requests for your school.' : 'Try changing the filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {users.map((user) => {
            const statusConfig = STATUS_CONFIG[user.status as UserStatus];
            return (
              <div
                key={user.id}
                className="glass-card p-5 flex flex-col gap-5 bg-white/70 hover:bg-white transition-all duration-300 group rounded-[2rem]"
              >
                {/* User info */}
                <div className="flex items-start justify-between gap-4">
                   <div className="flex items-center gap-4 min-w-0">
                    <Avatar
                      src={user.avatar_url}
                      name={user.full_name || 'User'}
                      size="lg"
                      className="ring-4 ring-bg-tertiary"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-text-primary truncate">
                        {user.full_name || 'Anonymous User'}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge variant="accent" className="text-[9px] font-black tracking-widest">
                          {ROLE_LABELS[user.role as UserRole]}
                        </Badge>
                        <span className="text-[10px] font-bold text-text-tertiary truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={statusConfig.color as 'success' | 'warning' | 'danger'}
                    className="text-[9px] font-black uppercase"
                  >
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="pt-4 border-t border-border/30 flex items-center justify-between">
                   <span className="text-[10px] font-bold text-text-tertiary">
                      REQUESTED {formatDate(user.created_at)}
                   </span>
                   
                   {/* Actions */}
                  {user.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(user.id)}
                        isLoading={actionLoading === user.id}
                        className="rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white"
                        leftIcon={<Check className="h-3.5 w-3.5" />}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReject(user.id)}
                        isLoading={actionLoading === user.id}
                        className="rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white"
                        leftIcon={<X className="h-3.5 w-3.5" />}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
