import { getUserAttendance } from '@/app/_lib/actions/attendance';
import { Card } from '@/app/_components/ui/card';
import { Badge } from '@/app/_components/ui/badge';
import { 
  Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, 
  TrendingUp, CalendarDays, PieChart, AlertCircle, ShieldCheck, CreditCard
} from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';
import { createClient } from '@/app/_lib/supabase/server';
import { redirect } from 'next/navigation';

import { getFullProfile } from '@/app/_lib/actions/profile';

export default async function StudentAttendancePage() {
  const { data: profile } = await getFullProfile();
  const user = profile;

  if (!user) redirect('/login');

  const { data, error } = await getUserAttendance(user.id);
  const attendance = data || [];

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent' || a.status === 'rejected').length,
    pending: attendance.filter(a => a.status === 'pending').length,
    percentage: attendance.filter(a => a.status !== 'pending').length > 0 
      ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.filter(a => a.status !== 'pending').length) * 100) 
      : 0
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
           <Badge variant="accent" dot>Personal Records</Badge>
           <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Attendance Logs</span>
        </div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter flex items-center gap-3">
           My Attendance
        </h1>
        <p className="text-text-secondary font-medium font-bold">Track your daily presence, verified logs, and pending scan requests</p>
      </div>

      {/* Fee Status Banner */}
      <div className={cn(
        "p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4",
        user?.student?.fee_status === 'paid' ? "bg-emerald-50 border-emerald-100" : user?.student?.fee_status === 'pending' ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm",
            user?.student?.fee_status === 'paid' ? "bg-emerald-500 text-white" : user?.student?.fee_status === 'pending' ? "bg-amber-500 text-white" : "bg-red-500 text-white"
          )}>
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-black text-text-primary tracking-tight">Fee Verification Status</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Current status: <span className={cn(
              user?.student?.fee_status === 'paid' ? "text-emerald-600" : user?.student?.fee_status === 'pending' ? "text-amber-600" : "text-red-600"
            )}>{user?.student?.fee_status?.toUpperCase() || 'UNPAID'}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.student?.fee_status === 'paid' ? (
            <Badge variant="success" className="px-4 py-2 rounded-xl">Attendance Unlocked</Badge>
          ) : (
            <Badge variant="danger" className="px-4 py-2 rounded-xl">Attendance Restricted</Badge>
          )}
        </div>
      </div>

      {/* Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-8 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-xl relative overflow-hidden group">
          <TrendingUp className="absolute -top-4 -right-4 h-32 w-32 opacity-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-3">Attendance Rate</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black">{stats.percentage}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-border/50 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Approved</p>
          <span className="text-3xl font-black text-text-primary">{stats.present}</span>
        </Card>

        <Card className="p-6 bg-white border-border/50 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center mb-3">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Pending</p>
          <span className="text-3xl font-black text-text-primary">{stats.pending}</span>
        </Card>

        <Card className="p-6 bg-white border-border/50 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Absent</p>
          <span className="text-3xl font-black text-text-primary">{stats.absent}</span>
        </Card>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
           <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
           <p className="text-sm font-black text-red-800 tracking-tight">
             Failed to load attendance records: {error}
           </p>
        </div>
      )}

      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center gap-4 animate-pulse ring-2 ring-amber-500/10">
           <Clock className="h-6 w-6 text-amber-600 flex-shrink-0" />
           <p className="text-sm font-black text-amber-800 tracking-tight">
             You have {stats.pending} scan request(s) waiting for approval by your teacher or principal.
           </p>
        </div>
      )}

      {/* History List */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
           <PieChart className="h-5 w-5 text-accent" />
           <h2 className="text-xl font-black text-text-primary tracking-tight uppercase">Attendance History</h2>
        </div>

        <Card className="p-0 border-none shadow-2xl bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-bg-tertiary/30 text-[10px] font-black uppercase tracking-widest text-text-tertiary border-b border-border/50">
                <tr>
                  <th className="px-8 py-6">Date</th>
                  <th className="px-8 py-6 text-center">Verification Status</th>
                  <th className="px-8 py-6 text-center">Method</th>
                  <th className="px-8 py-6 text-right">Activity Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center opacity-30 italic font-black">No attendance records found yet</td>
                  </tr>
                ) : (
                  attendance.map((record, i) => (
                    <tr key={i} className="hover:bg-bg-secondary/20 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-bg-tertiary flex flex-col items-center justify-center border border-border/50 shadow-sm font-black text-accent group-hover:scale-105 transition-transform">
                            <span className="text-[9px] uppercase leading-none opacity-60">{new Date(record.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-xl leading-none mt-1">{new Date(record.date).getDate()}</span>
                          </div>
                          <div className="font-black text-text-primary tracking-tight text-base">
                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <Badge 
                           variant={record.status === 'present' ? 'success' : record.status === 'pending' ? 'warning' : 'danger'}
                           dot
                           className="px-4 py-1.5"
                         >
                           {record.status === 'present' ? 'Verified' : record.status}
                         </Badge>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest bg-bg-tertiary/50 px-4 py-1.5 rounded-full border border-border/50">
                           {record.method}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 text-text-tertiary font-black text-xs uppercase tracking-tight">
                          <Clock className="h-3.5 w-3.5 text-accent" />
                          {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>

  );
}
