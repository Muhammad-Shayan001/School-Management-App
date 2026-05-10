'use client';

import { useState, useEffect } from 'react';
import { getStudentsWithFees, updateFeeStatus } from '@/app/_lib/actions/fees';
import { getClasses } from '@/app/_lib/actions/schools';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Select } from '@/app/_components/ui/select';
import { Badge } from '@/app/_components/ui/badge';
import { Avatar } from '@/app/_components/ui/avatar';
import { Search, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { FEE_STATUS_CONFIG, FEE_STATUS } from '@/app/_lib/utils/constants';
import type { FeeStatus } from '@/app/_lib/utils/constants';

export function FeeManagementClient() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [query, filterClass, filterStatus]);

  async function fetchData() {
    setIsLoading(true);
    const [studentsRes, classesRes] = await Promise.all([
      getStudentsWithFees({ 
        query, 
        class_id: filterClass || undefined, 
        fee_status: filterStatus as FeeStatus || undefined 
      }),
      getClasses()
    ]);
    
    if (studentsRes.data) setStudents(studentsRes.data);
    if (classesRes.data) setClasses(classesRes.data);
    setIsLoading(false);
  }

  async function handleUpdateStatus(studentId: string, status: FeeStatus) {
    setActionLoading(studentId + status);
    const res = await updateFeeStatus(studentId, status);
    if (!res.error) {
      await fetchData();
    }
    setActionLoading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Fee Management</h1>
          <p className="mt-1 text-sm text-text-secondary">Monitor and verify student fee payments</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 glass-card p-4 rounded-2xl">
        <div className="flex-1">
          <Input
            name="search"
            placeholder="Search by name, roll number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            name="class_filter"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            options={[
              { value: '', label: 'All Classes' },
              ...classes.map(c => ({ value: c.id, label: `${c.name} ${c.section ? `- ${c.section}` : ''}` }))
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            name="status_filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All Status' },
              { value: 'paid', label: 'Paid' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <PageSpinner label="Loading records..." />
      ) : students.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CreditCard className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-50" />
          <p className="text-text-secondary font-medium">No records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(student => {
            const config = FEE_STATUS_CONFIG[student.fee_status as FeeStatus];
            return (
              <div key={student.user_id} className="glass-card p-5 space-y-4 hover:border-accent/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar name={student.profiles?.full_name || 'S'} size="md" />
                    <div>
                      <h3 className="font-bold text-text-primary text-sm truncate max-w-[150px]">{student.profiles?.full_name}</h3>
                      <p className="text-xs text-text-secondary">{student.roll_number || 'No Roll No'}</p>
                    </div>
                  </div>
                  <Badge variant={config.color as any} dot>{config.label}</Badge>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50 text-sm">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Class:</span>
                    <span className="font-medium text-text-primary">{student.classes?.name} {student.classes?.section ? `- ${student.classes.section}` : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {student.fee_status !== 'paid' && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-success/10 text-success hover:bg-success hover:text-white border-success/20"
                      onClick={() => handleUpdateStatus(student.user_id, 'paid')}
                      isLoading={actionLoading === student.user_id + 'paid'}
                      leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
                    >
                      Mark Paid
                    </Button>
                  )}
                  {student.fee_status !== 'pending' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleUpdateStatus(student.user_id, 'pending')}
                      isLoading={actionLoading === student.user_id + 'pending'}
                      leftIcon={<Clock className="h-3.5 w-3.5" />}
                    >
                      Pending
                    </Button>
                  )}
                  {student.fee_status !== 'unpaid' && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-danger/10 text-danger hover:bg-danger hover:text-white border-danger/20"
                      onClick={() => handleUpdateStatus(student.user_id, 'unpaid')}
                      isLoading={actionLoading === student.user_id + 'unpaid'}
                      leftIcon={<XCircle className="h-3.5 w-3.5" />}
                    >
                      Unpaid
                    </Button>
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
