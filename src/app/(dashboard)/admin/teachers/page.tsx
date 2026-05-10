'use client';

import { useEffect, useState } from 'react';
import { getUsers, approveUser, rejectUser } from '@/app/_lib/actions/users';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { Badge } from '@/app/_components/ui/badge';
import { Button } from '@/app/_components/ui/button';
import { Avatar } from '@/app/_components/ui/avatar';
import { STATUS_CONFIG } from '@/app/_lib/utils/constants';
import type { UserStatus } from '@/app/_lib/utils/constants';
import type { Profile } from '@/app/_lib/types/database';
import { formatDate } from '@/app/_lib/utils/format';
import { cn } from '@/app/_lib/utils/cn';
import { Check, X, GraduationCap } from 'lucide-react';
import { PageSpinner } from '@/app/_components/ui/spinner';

export default function AdminTeachersPage() {
  const { user } = useAuthStore();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeachers() {
      setIsLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      const { data } = await getUsers({
        role: 'teacher',
        status: statusFilter as UserStatus,
        school_id: user?.school_id || undefined,
      });
      setTeachers(data || []);
      setIsLoading(false);
    }
    fetchTeachers();
  }, [filter, user?.school_id]);

  async function handleApprove(userId: string) {
    setActionLoading(userId);
    await approveUser(userId);
    setTeachers((prev) =>
      prev.map((t) => (t.id === userId ? { ...t, status: 'approved' as UserStatus } : t))
    );
    setActionLoading(null);
  }

  async function handleReject(userId: string) {
    setActionLoading(userId);
    await rejectUser(userId);
    setTeachers((prev) =>
      prev.map((t) => (t.id === userId ? { ...t, status: 'rejected' as UserStatus } : t))
    );
    setActionLoading(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Teachers</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage teacher registrations and access</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-bg-tertiary border border-border w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200',
              filter === tab ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-glass-hover'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSpinner label="Loading teachers..." />
      ) : teachers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <GraduationCap className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-50" />
          <p className="text-text-secondary font-medium">No teachers found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teachers.map((teacher) => {
            const statusConfig = STATUS_CONFIG[teacher.status as UserStatus];
            return (
              <div key={teacher.id} className="glass-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar src={teacher.avatar_url} name={teacher.full_name || 'Teacher'} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary truncate">{teacher.full_name}</p>
                      <Badge variant={statusConfig.color as 'success' | 'warning' | 'danger'} dot>{statusConfig.label}</Badge>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">{teacher.email}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">Registered {formatDate(teacher.created_at)}</p>
                  </div>
                </div>
                {teacher.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => handleApprove(teacher.id)} isLoading={actionLoading === teacher.id} leftIcon={<Check className="h-3.5 w-3.5" />}>Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => handleReject(teacher.id)} isLoading={actionLoading === teacher.id} leftIcon={<X className="h-3.5 w-3.5" />}>Reject</Button>
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
