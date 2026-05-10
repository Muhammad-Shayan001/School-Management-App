'use client';

import { useState, useEffect } from 'react';
import { getUsers } from '@/app/_lib/actions/users';
import { markAttendance, getSchoolAttendance, approveAttendance, rejectAttendance, getUserAttendance, getAttendanceStudents, finalizeDailyAttendance } from '@/app/_lib/actions/attendance';
import { getFullProfile } from '@/app/_lib/actions/profile';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { Card } from '@/app/_components/ui/card';
import { 
  Check, X, Clock, Users, Search, Calendar as CalendarIcon, 
  CheckCircle2, AlertCircle, Save, Filter, ShieldCheck, XCircle, 
  ListChecks, User, History, Sparkles, MapPin, TrendingUp, CalendarDays, PieChart
} from 'lucide-react';
import { Avatar } from '@/app/_components/ui/avatar';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { cn } from '@/app/_lib/utils/cn';
import { formatDate } from '@/app/_lib/utils/format';

export default function TeacherAttendancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [myRecords, setMyRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'approvals' | 'manual' | 'personal'>('personal');

  const loadData = async () => {
    setIsLoading(true);
    const { data: profile } = await getFullProfile();
    setTeacherProfile(profile);

    // 1. Load Personal Attendance (For everyone)
    if (profile?.id) {
       const { data: personal } = await getUserAttendance(profile.id);
       setMyRecords(personal || []);
    }

    // 2. Load Class Attendance (Only if Class Teacher)
    if (profile?.teacher?.class_id) {
      const { data: studentList } = await getAttendanceStudents();
      setStudents(studentList || []);

      const { data: dailyRecords } = await getSchoolAttendance(selectedDate, { 
        classId: profile.teacher.class_id 
      });
      setAttendanceRecords(dailyRecords || []);
      
      // Default to approvals if class teacher, otherwise stay on personal
      if (activeTab === 'personal') setActiveTab('approvals');
    } else {
      setActiveTab('personal');
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleManualMark = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!teacherProfile?.teacher?.class_id) return;
    setIsSaving(studentId);
    const result = await markAttendance({
      userId: studentId,
      role: 'student',
      status,
      method: 'manual',
      date: selectedDate,
      classId: teacherProfile.teacher.class_id
    });
    if (result.success) await loadData();
    setIsSaving(null);
  };

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    setIsProcessingApproval(id);
    const res = action === 'approve' ? await approveAttendance(id) : await rejectAttendance(id);
    if (res.success) await loadData();
    setIsProcessingApproval(null);
  };

  const handleFinalize = async () => {
    if (!confirm(`Are you sure you want to finalize attendance for ${selectedDate}? All unmarked students will be marked as ABSENT.`)) return;
    setIsFinalizing(true);
    const res = await finalizeDailyAttendance(selectedDate);
    if (res.success) {
      await loadData();
    } else {
      alert('Failed to finalize: ' + res.error);
    }
    setIsFinalizing(false);
  };

  const pendingRequests = attendanceRecords.filter(a => a.status === 'pending');
  const recordMap = attendanceRecords.reduce((acc, r) => ({ ...acc, [r.user_id]: r }), {});

  const stats = {
    present: myRecords.filter(a => a.status === 'present').length,
    absent: myRecords.filter(a => a.status === 'absent' || a.status === 'rejected').length,
    pending: myRecords.filter(a => a.status === 'pending').length,
    percentage: myRecords.filter(a => a.status !== 'pending').length > 0 
      ? Math.round((myRecords.filter(a => a.status === 'present').length / myRecords.filter(a => a.status !== 'pending').length) * 100) 
      : 0
  };

  if (isLoading) return <PageSpinner />;

  const isClassTeacher = !!teacherProfile?.teacher?.class_id;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="default" className="bg-accent/5 text-accent border-accent/20 font-black px-3 py-1 uppercase text-[10px]">
               {isClassTeacher ? `Class Teacher — ${teacherProfile.teacher.classes?.name}` : 'Subject Teacher'}
             </Badge>
             <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Attendance Portal</span>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter">Attendance & Logs</h1>
          <p className="text-text-secondary font-medium">{isClassTeacher ? 'Manage your classroom and track your own status' : 'Track your personal daily attendance logs'}</p>
        </div>

        {activeTab !== 'personal' && (
          <div className="flex items-center gap-3">
            <div className="relative bg-white p-1.5 rounded-2xl border border-border shadow-sm flex items-center">
              <CalendarIcon className="h-4 w-4 text-text-tertiary ml-3" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-3 pr-4 py-2 bg-transparent border-none text-sm font-black text-text-primary outline-none"
              />
            </div>
            {isClassTeacher && (
              <Button 
                onClick={handleFinalize} 
                isLoading={isFinalizing}
                variant="outline"
                className="h-[46px] border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Finalize Day
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Selection */}
      <div className="flex flex-wrap gap-2 p-1 bg-bg-tertiary rounded-2xl border border-border w-fit">
        <>
          <button
            onClick={() => setActiveTab('approvals')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'approvals' ? "bg-white text-accent shadow-sm" : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Scan Approvals ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'manual' ? "bg-white text-accent shadow-sm" : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <ListChecks className="h-4 w-4" />
            Class Roll Call
          </button>
        </>
        <button
          onClick={() => setActiveTab('personal')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === 'personal' ? "bg-white text-accent shadow-sm" : "text-text-tertiary hover:text-text-secondary"
          )}
        >
          <User className="h-4 w-4" />
          My Attendance
        </button>
      </div>

      {/* CONTENT SECTIONS */}
      {activeTab === 'personal' ? (
        <div className="space-y-8">
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

          {/* Detailed History */}
          <Card className="p-0 border-none shadow-2xl bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-bg-tertiary/30 text-[10px] font-black uppercase tracking-widest text-text-tertiary border-b border-border/50">
                  <tr>
                    <th className="px-8 py-6">Date</th>
                    <th className="px-8 py-6 text-center">Status</th>
                    <th className="px-8 py-6 text-center">Method</th>
                    <th className="px-8 py-6 text-right">Activity Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {myRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-24 text-center opacity-30 italic font-bold">No attendance records found yet</td>
                    </tr>
                  ) : (
                    myRecords.map((record, i) => (
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
                           >
                             {record.status}
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
      ) : activeTab === 'approvals' ? (
        <div className="space-y-6">
          {!isClassTeacher ? (
            <div className="py-24 text-center glass-card bg-bg-secondary/30">
               <AlertCircle className="h-16 w-16 text-amber-500/50 mx-auto mb-6" />
               <p className="text-text-secondary font-black text-xl tracking-tight">No class assigned. Please contact admin.</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="py-24 text-center glass-card bg-bg-secondary/30">
              <Clock className="h-16 w-16 text-amber-500/20 mx-auto mb-6" />
              <p className="text-text-secondary font-black italic text-xl tracking-tight">No pending scan requests for today</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pendingRequests.map((req) => (
                <Card key={req.id} className="p-8 border-none shadow-2xl bg-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />
                  <div className="flex items-center gap-5 mb-8">
                    <Avatar src={req.profiles?.avatar_url} name={req.profiles?.full_name} size="lg" className="border-4 border-amber-50 shadow-md" />
                    <div>
                      <h3 className="font-black text-text-primary text-xl tracking-tighter">{req.profiles?.full_name}</h3>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                        <Clock className="h-3.5 w-3.5" /> Scanned at {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleApproval(req.id, 'approve')}
                      isLoading={isProcessingApproval === req.id}
                      className="flex-1 h-12 rounded-2xl shadow-lg shadow-emerald-500/20"
                      leftIcon={<Check className="h-4 w-4" />}
                    >
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleApproval(req.id, 'reject')}
                      isLoading={isProcessingApproval === req.id}
                      variant="outline"
                      className="flex-1 h-12 rounded-2xl border-red-100 text-red-500 hover:bg-red-50"
                      leftIcon={<X className="h-4 w-4" />}
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Manual List */
        <div className="space-y-6">
          {!isClassTeacher ? (
            <div className="py-24 text-center glass-card bg-bg-secondary/30">
               <AlertCircle className="h-16 w-16 text-amber-500/50 mx-auto mb-6" />
               <p className="text-text-secondary font-black text-xl tracking-tight">No class assigned. Please contact admin.</p>
            </div>
          ) : students.length === 0 ? (
            <div className="py-24 text-center glass-card bg-bg-secondary/30">
               <Users className="h-16 w-16 text-text-tertiary/30 mx-auto mb-6" />
               <p className="text-text-secondary font-black text-xl tracking-tight">No students found for your class</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {students.map((student) => {
                const record = recordMap[student.id];
            return (
              <Card key={student.id} className={cn(
                "p-8 transition-all duration-500 border-none shadow-xl hover:shadow-2xl",
                record?.status === 'present' ? "bg-emerald-50/50 ring-2 ring-emerald-500/20" : 
                record?.status === 'absent' ? "bg-red-50/50 ring-2 ring-red-500/20" : "bg-white"
              )}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Avatar src={student.avatar_url} name={student.full_name} size="lg" className="border-4 border-white shadow-md" />
                    <div>
                      <h4 className="font-black text-text-primary text-lg tracking-tighter">{student.full_name}</h4>
                      <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mt-1">Roll: {student.roll_number}</p>
                    </div>
                  </div>
                  {record?.status && (
                    <Badge variant={record.status === 'present' ? 'success' : 'danger'} dot className="px-4 py-1.5">
                      {record.status}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleManualMark(student.id, 'present')}
                    isLoading={isSaving === student.id}
                    variant={record?.status === 'present' ? 'primary' : 'outline'}
                    className={cn(
                      "flex-1 h-12 rounded-2xl",
                      record?.status === 'present' ? "bg-emerald-500 hover:bg-emerald-600" : "border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                    )}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Present
                  </Button>
                  <Button
                    onClick={() => handleManualMark(student.id, 'absent')}
                    isLoading={isSaving === student.id}
                    variant={record?.status === 'absent' ? 'danger' : 'outline'}
                    className={cn(
                      "flex-1 h-12 rounded-2xl",
                      record?.status === 'absent' ? "bg-red-500 hover:bg-red-600" : "border-red-100 text-red-600 hover:bg-red-50"
                    )}
                    leftIcon={<XCircle className="h-4 w-4" />}
                  >
                    Absent
                  </Button>
                </div>
              </Card>
            );
          })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
