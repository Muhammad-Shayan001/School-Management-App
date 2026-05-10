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
import { Check, X, Users as UsersIcon } from 'lucide-react';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/_components/ui/tabs';
import { StudentManagementClient } from '@/app/_components/dashboard/StudentManagementClient';

function RegistrationsTab() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      const sf = filter === 'all' ? undefined : filter;
      const { data } = await getUsers({ role: 'student', status: sf as UserStatus, school_id: user?.school_id || undefined });
      setStudents(data || []);
      setIsLoading(false);
    }
    fetch();
  }, [filter, user?.school_id]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    await approveUser(id);
    setStudents(p => p.map(s => s.id === id ? { ...s, status: 'approved' as UserStatus } : s));
    setActionLoading(null);
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    await rejectUser(id);
    setStudents(p => p.map(s => s.id === id ? { ...s, status: 'rejected' as UserStatus } : s));
    setActionLoading(null);
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex gap-1 p-1 rounded-xl bg-bg-tertiary border border-border w-fit">
        {(['all','pending','approved','rejected'] as const).map(t=>(
          <button key={t} onClick={()=>setFilter(t)} className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',filter===t?'bg-accent text-white shadow-sm':'text-text-secondary hover:text-text-primary hover:bg-glass-hover')}>{t}</button>
        ))}
      </div>
      {isLoading ? <PageSpinner /> : students.length===0 ? (
        <div className="glass-card p-12 text-center"><UsersIcon className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-50"/><p className="text-text-secondary">No registrations found</p></div>
      ) : (
        <div className="space-y-3">
          {students.map(s=>{const sc=STATUS_CONFIG[s.status as UserStatus];return(
            <div key={s.id} className="glass-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar src={s.avatar_url} name={s.full_name||'Student'} size="md"/>
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><p className="text-sm font-semibold text-text-primary truncate">{s.full_name}</p><Badge variant={sc.color as 'success'|'warning'|'danger'} dot>{sc.label}</Badge></div>
                  <p className="text-xs text-text-tertiary mt-0.5">{s.email}</p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">Registered {formatDate(s.created_at)}</p>
                </div>
              </div>
              {s.status==='pending'&&(
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" onClick={()=>handleApprove(s.id)} isLoading={actionLoading===s.id} leftIcon={<Check className="h-3.5 w-3.5"/>}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={()=>handleReject(s.id)} isLoading={actionLoading===s.id} leftIcon={<X className="h-3.5 w-3.5"/>}>Reject</Button>
                </div>
              )}
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

export default function AdminStudentsPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="management">
        <TabsList>
          <TabsTrigger value="management">Manage Profiles</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
        </TabsList>
        <TabsContent value="management">
          <StudentManagementClient role="admin" />
        </TabsContent>
        <TabsContent value="registrations">
          <RegistrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
