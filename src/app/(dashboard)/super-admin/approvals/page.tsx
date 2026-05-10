'use client';

import { useEffect, useState } from 'react';
import { getUsers, approveUser, rejectUser } from '@/app/_lib/actions/users';
import { Badge } from '@/app/_components/ui/badge';
import { Button } from '@/app/_components/ui/button';
import { Avatar } from '@/app/_components/ui/avatar';
import { ROLES, ROLE_LABELS, STATUS_CONFIG } from '@/app/_lib/utils/constants';
import type { UserRole, UserStatus } from '@/app/_lib/utils/constants';
import type { Profile } from '@/app/_lib/types/database';
import { formatDate } from '@/app/_lib/utils/format';
import { cn } from '@/app/_lib/utils/cn';
import { Check, X, UserCheck, Clock, Filter } from 'lucide-react';
import { PageSpinner } from '@/app/_components/ui/spinner';

export default function ApprovalsPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      const { data } = await getUsers({ 
        status: statusFilter as UserStatus,
        role: ROLES.ADMIN 
      });
      setUsers(data || []);
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
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            User Approvals
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Review and manage registration requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-tertiary" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-bg-tertiary border border-border w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              filter === tab.key
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-glass-hover'
            )}
          >
            {tab.label}
            {'count' in tab && tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-warning text-black font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Users list */}
      {isLoading ? (
        <PageSpinner label="Loading users..." />
      ) : users.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <UserCheck className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-50" />
          <p className="text-text-secondary font-medium">No users found</p>
          <p className="text-sm text-text-tertiary mt-1">
            {filter === 'pending' ? 'No pending approvals at the moment.' : 'Try changing the filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const statusConfig = STATUS_CONFIG[user.status as UserStatus];
            return (
              <div
                key={user.id}
                className="glass-card p-4 flex items-center justify-between gap-4 animate-slide-in-up"
              >
                {/* User info */}
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar
                    src={user.avatar_url}
                    name={user.full_name || 'User'}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {user.full_name || 'Unknown'}
                      </p>
                      <Badge
                        variant={statusConfig.color as 'success' | 'warning' | 'danger'}
                        dot
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-text-tertiary truncate">
                        {user.email}
                      </span>
                      <Badge variant="accent">
                        {ROLE_LABELS[user.role as UserRole]}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-1">
                      Registered {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {user.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(user.id)}
                      isLoading={actionLoading === user.id}
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(user.id)}
                      isLoading={actionLoading === user.id}
                      leftIcon={<X className="h-3.5 w-3.5" />}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
