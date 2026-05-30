'use client';

import { useState, useEffect, useTransition } from 'react';
import { getSchoolAttendance, approveAttendance, rejectAttendance } from '@/app/_lib/actions/attendance';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { toast } from 'sonner';
import { User, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

type AttendanceRecord = NonNullable<Awaited<ReturnType<typeof getSchoolAttendance>>['data']>[number];

function AttendanceRequestCard({ record, onApprove, onReject, isProcessing }: { record: AttendanceRecord, onApprove: () => void, onReject: () => void, isProcessing: boolean }) {
  if (!record.profiles) return null;

  return (
    <div className="glass-card p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-bg-elevated flex items-center justify-center">
          <User className="h-6 w-6 text-text-secondary" />
        </div>
        <div>
          <p className="font-bold text-text-primary">{record.profiles.full_name}</p>
          <p className="text-xs text-text-secondary">
            Roll No: {record.profiles.student_profiles?.roll_number || 'N/A'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="warning">
          <Clock className="h-3 w-3 mr-1.5" />
          Pending Approval
        </Badge>
        <Button size="sm" variant="primary" onClick={onApprove} isLoading={isProcessing} aria-label="Approve">
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="danger" onClick={onReject} isLoading={isProcessing} aria-label="Reject">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AttendanceRequestsPage() {
  const [requests, setRequests] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, startTransition] = useTransition();
  const today = format(new Date(), 'yyyy-MM-dd');

  async function fetchRequests() {
    setIsLoading(true);
    const { data } = await getSchoolAttendance(today, { status: 'pending' });
    setRequests(data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveAttendance(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Attendance approved.');
        fetchRequests();
      }
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      const result = await rejectAttendance(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.warning('Attendance rejected.');
        fetchRequests();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Attendance Approval Requests
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review pending attendance from students with unpaid fees.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map(req => (
            <AttendanceRequestCard
              key={req.id}
              record={req}
              onApprove={() => handleApprove(req.id)}
              onReject={() => handleReject(req.id)}
              isProcessing={isProcessing}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 glass-card">
          <Check className="h-12 w-12 text-success mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary">All Clear!</h3>
          <p className="mt-1 text-sm text-text-secondary">
            There are no pending attendance requests to review.
          </p>
        </div>
      )}
    </div>
  );
}