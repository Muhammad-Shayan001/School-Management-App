'use client';

import { useState, useEffect } from 'react';
import { getSchoolAttendance, approveAttendance, rejectAttendance } from '@/app/_lib/actions/attendance';
import { getHolidays, addHoliday, deleteHoliday } from '@/app/_lib/actions/holidays';
import AttendanceScanner from '@/app/_components/attendance/AttendanceScanner';
import { Badge } from '@/app/_components/ui/badge';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { 
  Calendar as CalendarIcon, UserCheck, UserX, Scan, ListChecks, 
  Search, BarChart3, Clock, GraduationCap, Users, ShieldCheck, 
  XCircle, CheckCircle2, History, Filter, Plus, Trash2, CalendarX,
  Palmtree, Users2
} from 'lucide-react';
import { formatDate } from '@/app/_lib/utils/format';
import { cn } from '@/app/_lib/utils/cn';

export default function AdminAttendancePage() {
  const [activeMainTab, setActiveMainTab] = useState<'daily' | 'holidays'>('daily');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'present' | 'rejected'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Holiday Form State
  const [newHoliday, setNewHoliday] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    type: 'everyone' as 'everyone' | 'students' | 'teachers'
  });

  const fetchData = async () => {
    setIsLoading(true);
    if (activeMainTab === 'daily') {
      const { data } = await getSchoolAttendance(date, { 
        status: statusFilter === 'all' ? undefined : (statusFilter === 'present' ? 'present' : statusFilter) 
      });
      setAttendance(data || []);
    } else {
      const { data } = await getHolidays();
      setHolidays(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [date, statusFilter, activeMainTab]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    const res = action === 'approve' ? await approveAttendance(id) : await rejectAttendance(id);
    if (res.success) await fetchData();
    setProcessingId(null);
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addHoliday(newHoliday);
    if (res.success) {
      setNewHoliday({ ...newHoliday, title: '' });
      fetchData();
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (confirm('Delete this off-day?')) {
      const res = await deleteHoliday(id);
      if (res.success) fetchData();
    }
  };

  const stats = {
    pending: attendance.filter(a => a.status === 'pending').length,
    present: attendance.filter(a => a.status === 'present').length,
    rejected: attendance.filter(a => a.status === 'rejected').length,
    total: attendance.length,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
               <ShieldCheck className="h-3 w-3" /> Principal's Control
             </div>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter">School Attendance</h1>
        </div>

        {/* Top Tabs */}
        <div className="flex p-1.5 bg-white rounded-2xl border border-border shadow-sm">
          <button
            onClick={() => setActiveMainTab('daily')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeMainTab === 'daily' ? "bg-accent text-white" : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <History className="h-4 w-4" /> Daily Logs
          </button>
          <button
            onClick={() => setActiveMainTab('holidays')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeMainTab === 'holidays' ? "bg-accent text-white" : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <CalendarX className="h-4 w-4" /> Holiday Manager
          </button>
        </div>
      </div>

      {activeMainTab === 'daily' ? (
        <>
          {/* Daily Logs UI (Existing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Verified Present', value: stats.present, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Rejected Scans', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Total Activity', value: stats.total, icon: History, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((stat, i) => (
              <Card key={i} className={cn("p-6 flex items-center gap-5 border-none shadow-md", stat.bg)}>
                <div className={cn("p-4 rounded-2xl bg-white shadow-sm", stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{stat.label}</p>
                  <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-1">
              <Card className="p-8 border-none shadow-xl bg-gradient-to-br from-white to-bg-secondary sticky top-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <Scan className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-black text-text-primary tracking-tight">QR Scanner</h2>
                </div>
                <div className="glass-card p-2 rounded-3xl border-accent/20">
                  <AttendanceScanner />
                </div>
              </Card>
            </div>

            <div className="xl:col-span-3 space-y-6">
              <Card className="p-0 border-none shadow-xl overflow-hidden bg-white min-h-[600px] flex flex-col">
                <div className="p-6 border-b border-border/50 bg-bg-secondary/20 flex flex-col md:flex-row gap-4 items-center justify-between">
                   <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-border">
                     <CalendarIcon className="h-4 w-4 text-accent" />
                     <input 
                       type="date" 
                       value={date} 
                       onChange={(e) => setDate(e.target.value)}
                       className="bg-transparent border-none text-sm font-black text-text-primary outline-none"
                     />
                   </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                     {(['all', 'pending', 'present', 'rejected'] as const).map((s) => (
                       <button
                         key={s}
                         onClick={() => setStatusFilter(s)}
                         className={cn(
                           "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                           statusFilter === s ? "bg-accent text-white" : "bg-white text-text-tertiary border"
                         )}
                       >
                         {s === 'present' ? 'Verified' : s}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-bg-tertiary/50 text-[10px] font-black uppercase tracking-widest text-text-tertiary border-b border-border/50">
                      <tr>
                        <th className="px-8 py-5">User Profile</th>
                        <th className="px-8 py-5">Role</th>
                        <th className="px-8 py-5">Scan Time</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {isLoading ? (
                        <tr><td colSpan={5} className="px-8 py-20 text-center"><PageSpinner /></td></tr>
                      ) : attendance.map((record) => (
                        <tr key={record.id} className="hover:bg-bg-secondary/30 transition-colors">
                          <td className="px-8 py-4 font-black text-text-primary">{record.profiles?.full_name}</td>
                          <td className="px-8 py-4 font-bold text-xs uppercase text-text-tertiary">{record.role}</td>
                          <td className="px-8 py-4 font-bold text-xs text-text-tertiary">
                             {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-8 py-4">
                            <Badge className={cn(
                              "px-3 py-1 font-black text-[10px] uppercase tracking-widest border-none",
                              record.status === 'present' ? "bg-emerald-500 text-white" :
                              record.status === 'rejected' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                            )}>
                              {record.status === 'present' ? 'Verified' : record.status}
                            </Badge>
                          </td>
                          <td className="px-8 py-4 text-right">
                             {record.status === 'pending' && (
                               <div className="flex gap-2 justify-end">
                                 <Button size="sm" onClick={() => handleAction(record.id, 'approve')}>Verify</Button>
                                 <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleAction(record.id, 'reject')}>Reject</Button>
                               </div>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        /* Holiday Manager UI */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="p-8 border-none shadow-xl bg-white space-y-6 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
               <Palmtree className="h-6 w-6 text-emerald-500" />
               <h2 className="text-xl font-black text-text-primary tracking-tight">Add Off-Day</h2>
            </div>
            
            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-1 block">Off-Day Date</label>
                <input 
                  type="date"
                  required
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm font-bold focus:border-accent outline-none"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-1 block">Occasion Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Winter Break, Sports Day"
                  value={newHoliday.title}
                  onChange={(e) => setNewHoliday({ ...newHoliday, title: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm font-bold focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-1 block">Applicable For</label>
                <div className="grid grid-cols-3 gap-2">
                   {(['everyone', 'students', 'teachers'] as const).map((t) => (
                     <button
                       key={t}
                       type="button"
                       onClick={() => setNewHoliday({ ...newHoliday, type: t })}
                       className={cn(
                         "py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                         newHoliday.type === t ? "bg-accent text-white border-accent" : "bg-white text-text-tertiary border-border hover:border-accent"
                       )}
                     >
                       {t}
                     </button>
                   ))}
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                <Plus className="h-4 w-4 mr-2" /> Schedule Off-Day
              </Button>
            </form>

            <div className="p-4 bg-bg-tertiary rounded-xl border border-border/50">
              <p className="text-[11px] text-text-secondary font-bold flex items-center gap-2 leading-relaxed">
                <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                Sundays are automatically excluded from attendance reports by the system.
              </p>
            </div>
          </Card>

          <Card className="p-0 border-none shadow-xl bg-white lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border/50 bg-bg-secondary/20 flex items-center justify-between">
               <h2 className="text-xl font-black text-text-primary tracking-tight">Holiday Calendar</h2>
               <Badge className="bg-emerald-100 text-emerald-700 font-black">{holidays.length} Scheduled</Badge>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-bg-tertiary/50 text-[10px] font-black uppercase tracking-widest text-text-tertiary border-b border-border/50">
                  <tr>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Occasion</th>
                    <th className="px-8 py-5">Target</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {holidays.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-20 text-center opacity-30 italic font-bold">No holidays scheduled</td></tr>
                  ) : holidays.map((holiday) => (
                    <tr key={holiday.id} className="hover:bg-bg-secondary/30 transition-colors">
                      <td className="px-8 py-4 font-black text-text-primary">{formatDate(holiday.date)}</td>
                      <td className="px-8 py-4 font-bold text-text-secondary">{holiday.title}</td>
                      <td className="px-8 py-4">
                        <Badge variant="default" className="font-black text-[9px] uppercase tracking-widest border-emerald-200 text-emerald-700 bg-emerald-50">
                          {holiday.type}
                        </Badge>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteHoliday(holiday.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
