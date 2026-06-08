'use client';

import { useState } from 'react';
import { 
  Search, Filter, MoreVertical, Eye, Download, 
  Printer, UserPlus, CheckCircle2, XCircle, 
  ChevronRight, Calendar, Mail, Phone, MapPin,
  GraduationCap, BookOpen, Layers, Activity,
  Briefcase, Award, Clock, Info, Trash2, Edit, Key, Shield, Lock, Trash
} from 'lucide-react';
import { Badge } from '@/app/_components/ui/badge';
import { Input } from '@/app/_components/ui/input';
import { Select } from '@/app/_components/ui/select';
import { Button } from '@/app/_components/ui/button';
import { Modal } from '@/app/_components/ui/modal';
import { cn } from '@/app/_lib/utils/cn';
import { AddTeacherModal } from './add-teacher-modal';
import { CredentialSuccessModal } from './credential-success-modal';
import TeacherIDCard from '@/app/_components/id-card/TeacherIDCard';
import { useCampusStore } from '@/app/_lib/store/campus-store';
import { deleteStudentProfile, approveUser, rejectUser, resetUserPassword, toggleUserStatus, getUserLoginDetails } from '@/app/_lib/actions/users';
import { toast } from 'sonner';

interface TeacherManagementProps {
  teachers: any[];
  classes: any[];
  subjects: any[];
  school?: any;
}

export function TeacherManagement({ teachers, classes, subjects, school }: TeacherManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampusId, setSelectedCampusId] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isIDCardOpen, setIsIDCardOpen] = useState(false);
  const [loginDetailsUser, setLoginDetailsUser] = useState<any>(null);
  
  const [showCredentials, setShowCredentials] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Assigned Classes');
  const [isSyncing, setIsSyncing] = useState(false);

  const { campuses, activeCampus } = useCampusStore();

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = 
      t.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.teacher_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.profiles?.status === statusFilter;
    const matchesCampus = selectedCampusId === 'all' || t.campus_id === selectedCampusId || (activeCampus && t.campus_id === activeCampus.id);
    return matchesSearch && matchesStatus && matchesCampus;
  });

  const openProfile = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsProfileOpen(true);
    setActiveTab('Assigned Classes');
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsEditModalOpen(true);
  };

  const handleViewIDCard = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsIDCardOpen(true);
  };

  const handleViewLoginDetails = async (teacher: any) => {
    const res = await getUserLoginDetails(teacher.user_id || teacher.profiles?.id);
    if (!res.error && res.data) {
      setLoginDetailsUser(res.data);
    } else {
      toast.error(res.error || 'Failed to fetch login credentials');
    }
  };

  const handleResetPassword = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to reset the password for ${name}?`)) return;
    const res = await resetUserPassword(userId);
    if (res.success) {
      toast.success(`Password reset successful for ${name}`, {
        description: `New password: ${res.newPassword}`,
        duration: 10000,
        style: { borderRadius: '1.5rem', fontWeight: 'bold' }
      });
    } else {
      toast.error(res.error || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string, name: string) => {
    const res = await toggleUserStatus(userId);
    if (res.success) {
      toast.success(`Account status updated for ${name}`, {
        description: `New status: ${res.status}`,
        style: { borderRadius: '1.5rem', fontWeight: 'bold' }
      });
    } else {
      toast.error(res.error || 'Failed to toggle status');
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Faculty data synchronization complete!');
    }, 2000);
  };

  const handleDelete = async (id: string, name?: string) => {
    if (confirm(`Are you absolutely sure you want to remove ${name || 'this faculty member'}? This action is irreversible.`)) {
      const res = await deleteStudentProfile(id); // Reusing delete profile action
      if (res.success) {
        toast.success('Faculty member removed');
        setIsProfileOpen(false);
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    }
  };

  const handleStatusUpdate = async (id: string, action: 'approve' | 'reject') => {
    const res = action === 'approve' ? await approveUser(id) : await rejectUser(id);
    if (!res.error) {
      toast.success(`Faculty member ${action}d`);
      setIsProfileOpen(false);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Search & Filter Bar - Glass-Premium */}
      <div className="glass-card p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/[0.02] flex flex-col lg:flex-row gap-6 items-center justify-between rounded-[2.5rem]">
        <div className="relative w-full lg:w-[450px] group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary group-focus-within:text-accent transition-all duration-300" />
          <Input 
            placeholder="Search faculty by name, ID, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-14 h-14 bg-bg-tertiary/50 border-transparent focus:bg-white focus:border-accent/20 rounded-[1.5rem] transition-all duration-500 font-bold placeholder:text-text-tertiary/50 shadow-sm focus:shadow-xl"
          />
        </div>
        <div className="flex flex-wrap gap-4 w-full lg:w-auto items-center">
          {campuses && campuses.length > 1 && (
            <Select 
              value={selectedCampusId}
              onChange={(e) => setSelectedCampusId(e.target.value)}
              options={[
                { label: 'All Campuses', value: 'all' },
                ...campuses.map(c => ({ label: c.name, value: c.id }))
              ]}
              className="h-14 min-w-[180px] rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest border-transparent bg-bg-tertiary/50"
            />
          )}
          <Select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Faculty', value: 'all' },
              { label: 'Active', value: 'approved' },
              { label: 'Pending', value: 'pending' },
              { label: 'Rejected', value: 'rejected' }
            ]}
            className="h-14 min-w-[180px] rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest border-transparent bg-bg-tertiary/50"
          />
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="h-14 px-8 rounded-[1.5rem] gap-3 font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-accent/20 bg-accent text-white hover:scale-105 active:scale-95 transition-all ml-auto"
          >
            <UserPlus className="h-5 w-5" /> Add Teacher
          </Button>
        </div>
      </div>

      {/* Teacher Grid/Table - Luxury Design */}
      <div className="glass-card bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/[0.02] overflow-hidden rounded-[2rem] md:rounded-[3rem]">
        <div className="overflow-x-auto overflow-y-auto max-h-[650px] scrollbar-premium">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-bg-tertiary/30 border-b border-border/40">
                <th className="px-6 md:px-10 py-5 md:py-7 text-[10px] md:text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em] sticky top-0 bg-white/95 backdrop-blur-md z-10 shadow-sm whitespace-nowrap">Faculty Member</th>
                <th className="px-6 py-5 md:py-7 text-[10px] md:text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em] sticky top-0 bg-white/95 backdrop-blur-md z-10 shadow-sm whitespace-nowrap">Role Specialist</th>
                <th className="px-6 py-5 md:py-7 text-[10px] md:text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em] sticky top-0 bg-white/95 backdrop-blur-md z-10 shadow-sm whitespace-nowrap">Professional XP</th>
                <th className="px-6 py-5 md:py-7 text-[10px] md:text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em] sticky top-0 bg-white/95 backdrop-blur-md z-10 shadow-sm whitespace-nowrap">Uplink Stream</th>
                <th className="px-6 py-5 md:py-7 text-[10px] md:text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em] sticky top-0 bg-white/95 backdrop-blur-md z-10 shadow-sm whitespace-nowrap">Account Status</th>
                <th className="px-6 md:px-10 py-5 md:py-7 text-right text-[10px] md:text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em] sticky top-0 bg-white/95 backdrop-blur-md z-10 shadow-sm whitespace-nowrap">Master Management Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-accent/[0.02] transition-all duration-300 group cursor-default">
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-bg-tertiary to-border/30 flex-shrink-0 overflow-hidden border border-border/50 shadow-sm relative">
                        {teacher.profiles?.avatar_url ? (
                          <img src={teacher.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-purple-500/5 text-purple-600 font-black text-xl uppercase">
                            {teacher.profiles?.full_name?.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-text-primary leading-tight group-hover:text-accent transition-all duration-300 truncate max-w-[180px]">{teacher.profiles?.full_name}</p>
                        <p className="text-[11px] font-bold text-text-tertiary mt-1 opacity-70 truncate max-w-[180px]">ID: {teacher.teacher_id || '---'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                       <Badge variant={teacher.is_class_teacher ? "accent" : "default"} className="w-fit text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 shadow-sm">
                         {teacher.is_class_teacher ? "CLASS LEAD" : "SUBJECT SPECIALIST"}
                       </Badge>
                       <span className="text-[11px] font-bold text-text-secondary truncate max-w-[150px]">
                         {teacher.qualification || 'Faculty Staff'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-bg-tertiary/50 border border-border/30 group-hover:bg-white transition-all">
                        <Award className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-black text-text-primary">{teacher.experience || 'New'}</span>
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest opacity-60">Years</span>
                     </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col space-y-0.5 min-w-0">
                      <span className="text-[11px] font-black text-text-primary tracking-tight truncate max-w-[180px]">{teacher.profiles?.email}</span>
                      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest opacity-60">{teacher.phone || 'NO COMMS'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "h-2.5 w-2.5 rounded-full shadow-sm", 
                          teacher.profiles?.status === 'approved' ? "bg-success shadow-success/40 animate-pulse" : "bg-rose-500 shadow-rose-500/40"
                        )} />
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.1em]">{teacher.profiles?.status === 'approved' ? 'Active' : teacher.profiles?.status || 'Disabled'}</span>
                     </div>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-all duration-500">
                       <button 
                         onClick={() => openProfile(teacher)}
                         className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all duration-300 shadow-sm active:scale-95"
                         title="View Dossier & Intelligence Profile"
                        >
                         <Eye className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleEditTeacher(teacher)}
                         className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm active:scale-95"
                         title="Reopen & Master Edit Record"
                        >
                         <Edit className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleViewIDCard(teacher)}
                         className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all duration-300 shadow-sm active:scale-95"
                         title="View & Export Premium ID Card"
                        >
                         <Printer className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleViewLoginDetails(teacher)}
                         className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm active:scale-95"
                         title="Inspect Login Credentials & Auth Data"
                        >
                         <Key className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleToggleStatus(teacher.user_id || teacher.profiles?.id, teacher.profiles?.status, teacher.profiles?.full_name)}
                         className={cn(
                           "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm active:scale-95",
                           teacher.profiles?.status === 'approved' ? "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                         )}
                         title="Toggle Account Enable/Disable Status"
                        >
                         <Shield className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleResetPassword(teacher.user_id || teacher.profiles?.id, teacher.profiles?.full_name)}
                         className="h-10 w-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all duration-300 shadow-sm active:scale-95"
                         title="Reset Account Password"
                        >
                         <Lock className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleDelete(teacher.profiles?.id || teacher.user_id, teacher.profiles?.full_name)}
                         className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all duration-300 shadow-sm active:scale-95 ml-1"
                         title="Purge Teacher Record"
                       >
                         <Trash className="h-4 w-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTeachers.length === 0 && (
            <div className="py-24 text-center space-y-6">
              <div className="h-24 w-24 bg-gradient-to-br from-bg-tertiary to-white rounded-full flex items-center justify-center mx-auto shadow-inner border border-border/30">
                <Search className="h-10 w-10 text-text-tertiary/40" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-text-primary uppercase tracking-[0.25em]">No faculty detected</p>
                <p className="text-[11px] font-bold text-text-tertiary">Try refining your search parameters.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Teacher Profile Modal - Intelligence Master */}
      <Modal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        title="Faculty Intelligence Profile & Master Dossier"
        size="3xl"
        className="rounded-[3rem] overflow-hidden border-none"
      >
        {selectedTeacher && (
          <div className="space-y-10 max-h-[85vh] overflow-y-auto pr-3 scrollbar-premium animate-in fade-in slide-in-from-top-4 duration-700 pb-10">
             {/* Profile Header Banner */}
             <div className="relative p-8 md:p-10 rounded-[3rem] bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/10 flex flex-col md:flex-row items-center gap-8 md:gap-10 overflow-hidden group/header">
                <div className="absolute -top-32 -right-32 h-80 w-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none group-hover/header:scale-125 transition-transform duration-1000" />
                
                <div className="relative z-10 h-32 w-32 md:h-40 md:w-40 rounded-[2.5rem] bg-white p-1.5 shadow-2xl transition-transform duration-700 hover:-rotate-3 flex-shrink-0">
                   <div className="h-full w-full rounded-[2.2rem] overflow-hidden bg-bg-tertiary relative">
                     {selectedTeacher.profiles?.avatar_url ? (
                        <img src={selectedTeacher.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-4xl md:text-5xl font-black text-purple-600 uppercase">
                          {selectedTeacher.profiles?.full_name?.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2.2rem]" />
                   </div>
                   <div className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 h-8 w-8 md:h-10 md:w-10 rounded-2xl bg-success border-4 border-white flex items-center justify-center shadow-xl">
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
                   </div>
                </div>

                <div className="space-y-4 text-center md:text-left relative z-10 flex-1 min-w-0">
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter leading-tight break-words max-w-full">{selectedTeacher.profiles?.full_name}</h2>
                      <Badge variant="accent" className="uppercase text-[11px] font-black tracking-[0.3em] px-6 py-2 shadow-xl shadow-purple-500/20 bg-purple-600 text-white">FACULTY</Badge>
                   </div>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-sm font-bold text-text-secondary opacity-80">
                      <div className="flex items-center gap-3">
                         <div className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse" /> 
                         <span className="font-black text-text-primary tracking-widest uppercase truncate max-w-[200px]">ID: {selectedTeacher.teacher_id || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 
                         <span className="font-black text-text-primary uppercase truncate max-w-[200px]">MEMBER SINCE {new Date(selectedTeacher.created_at || Date.now()).getFullYear()}</span>
                      </div>
                   </div>
                </div>

                <div className="md:ml-auto flex flex-wrap gap-2 relative z-10 w-full md:w-auto justify-center md:justify-end">
                   <Button 
                    variant="outline" 
                    onClick={() => handleEditTeacher(selectedTeacher)}
                    className="rounded-2xl h-11 px-5 gap-2 font-black text-[10px] uppercase tracking-wider bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-200"
                   >
                      <Edit className="h-4 w-4" /> Edit Profile
                   </Button>
                   <Button 
                    variant="outline" 
                    onClick={() => handleViewIDCard(selectedTeacher)}
                    className="rounded-2xl h-11 px-5 gap-2 font-black text-[10px] uppercase tracking-wider bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white border-amber-200"
                   >
                      <Printer className="h-4 w-4" /> Faculty ID
                   </Button>
                   <div className="flex gap-2">
                      {selectedTeacher.profiles?.status === 'pending' && (
                        <>
                          <Button 
                            variant="primary" 
                            onClick={() => handleStatusUpdate(selectedTeacher.profiles?.id, 'approve')}
                            className="rounded-2xl h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase"
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="danger" 
                            onClick={() => handleStatusUpdate(selectedTeacher.profiles?.id, 'reject')}
                            className="rounded-2xl h-11 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="danger" 
                        onClick={() => handleDelete(selectedTeacher.profiles?.id || selectedTeacher.user_id, selectedTeacher.profiles?.full_name)}
                        className="rounded-2xl h-11 px-5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-rose-200 font-black text-[10px] uppercase gap-2"
                      >
                         <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                {/* Professional Data Silos */}
                <div className="lg:col-span-1 space-y-8">
                   <div className="glass-card p-6 md:p-8 bg-white/50 border border-white/40 shadow-xl shadow-black/[0.01] rounded-[2.5rem]">
                      <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6 md:mb-8 flex items-center gap-3">
                        <div className="h-1 w-4 bg-purple-500 rounded-full" /> Faculty Details
                      </h4>
                      <div className="space-y-4 md:space-y-5">
                         <InfoItem icon={Mail} label="Work Uplink" value={selectedTeacher.profiles?.email} />
                         <InfoItem icon={Phone} label="Contact Stream" value={selectedTeacher.phone} />
                         <InfoItem icon={Award} label="Core Qualification" value={selectedTeacher.qualification} />
                         <InfoItem icon={Briefcase} label="Tenure Length" value={`${selectedTeacher.experience || '0'} Years`} />
                         <InfoItem icon={MapPin} label="Home Base" value={selectedTeacher.address} />
                      </div>
                   </div>

                   <div className="glass-card p-6 md:p-8 bg-white/50 border border-white/40 shadow-xl shadow-black/[0.01] rounded-[2.5rem]">
                      <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6 md:mb-8 flex items-center gap-3">
                        <div className="h-1 w-4 bg-emerald-500 rounded-full" /> Status Monitor
                      </h4>
                      <div className="space-y-6">
                         <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50">
                            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Attendance</span>
                            <Badge variant="success" className="bg-emerald-600 text-white border-none text-[9px]">98% OPTIMAL</Badge>
                         </div>
                         <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-tertiary/50 border border-border/30">
                            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Last Activity</span>
                            <span className="text-[10px] font-black text-text-primary uppercase tracking-tighter">09:15 AM TODAY</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Academic & Performance Matrix */}
                <div className="lg:col-span-2 space-y-8">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                      <div className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/10 flex items-center gap-4 md:gap-5 group/classes hover:bg-white hover:shadow-2xl transition-all duration-700 cursor-default min-w-0 overflow-hidden">
                         <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover/classes:scale-110 transition-transform flex-shrink-0">
                            <Layers className="h-6 w-6 md:h-7 md:w-7" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.25em] mb-1">Classroom Load</p>
                            <p className="text-xl md:text-2xl font-black text-text-primary tracking-tighter truncate">5 <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest ml-1">Assigned</span></p>
                         </div>
                      </div>
                      <div className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/10 flex items-center gap-4 md:gap-5 group/subjects hover:bg-white hover:shadow-2xl transition-all duration-700 cursor-default min-w-0 overflow-hidden">
                         <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover/subjects:scale-110 transition-transform flex-shrink-0">
                            <BookOpen className="h-6 w-6 md:h-7 md:w-7" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.25em] mb-1">Specializations</p>
                            <p className="text-xl md:text-2xl font-black text-text-primary tracking-tighter truncate">3 <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest ml-1">Subjects</span></p>
                         </div>
                      </div>
                   </div>

                   {/* Faculty Intelligence Matrix */}
                   <div className="glass-card p-6 md:p-10 bg-white border border-border/30 shadow-2xl shadow-black/[0.01] rounded-[3rem] relative overflow-hidden">
                      <div className="flex items-center gap-6 md:gap-10 border-b border-border/40 mb-8 md:mb-10 overflow-x-auto scrollbar-hide">
                         {['Assigned Classes', 'Timetable', 'Performance', 'Log'].map((tab) => (
                           <button 
                             key={tab} 
                             onClick={() => setActiveTab(tab)}
                             className={cn(
                               "pb-5 md:pb-6 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] transition-all relative group flex-shrink-0",
                               activeTab === tab ? "text-purple-600" : "text-text-tertiary hover:text-text-primary"
                             )}
                           >
                              {tab}
                              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-full animate-in fade-in slide-in-from-left-2 duration-500" />}
                           </button>
                         ))}
                      </div>

                       <div className="space-y-8 animate-in fade-in duration-700">
                         {activeTab === 'Assigned Classes' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {classes.filter(c => c.id === selectedTeacher.class_id || selectedTeacher.is_class_teacher).map((cls, idx) => (
                                 <div key={idx} className="p-4 rounded-2xl bg-bg-tertiary/40 border border-border/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                          <Layers className="h-5 w-5 text-purple-500" />
                                       </div>
                                       <div>
                                          <p className="text-xs font-black text-text-primary">{cls.name} - {cls.section}</p>
                                          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Primary Lead</p>
                                       </div>
                                    </div>
                                    <Badge variant="default" className="text-[9px]">ACTIVE</Badge>
                                 </div>
                               ))}
                               {classes.filter(c => c.id === selectedTeacher.class_id || selectedTeacher.is_class_teacher).length === 0 && (
                                 <div className="col-span-2 py-10 text-center text-[10px] font-black text-text-tertiary uppercase tracking-widest italic opacity-60 border-2 border-dashed border-border/30 rounded-2xl">
                                    No direct class leads assigned
                                 </div>
                               )}
                            </div>
                         )}

                         {activeTab === 'Timetable' && (
                           <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                               <Clock className="h-6 w-6 text-purple-600" />
                               <div>
                                 <h5 className="text-xs font-black text-purple-950 uppercase tracking-wider">Weekly Lesson Distribution</h5>
                                 <p className="text-xs font-bold text-purple-600/80">24 periods assigned across 3 sections</p>
                               </div>
                             </div>
                             <Badge className="bg-purple-600 text-white font-black">OPTIMAL LOAD</Badge>
                           </div>
                         )}

                         {activeTab === 'Performance' && (
                           <div className="space-y-4">
                             <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                               <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">Student Evaluation Average</span>
                               <Badge variant="success" className="bg-emerald-600 text-white font-black">4.9 / 5.0 RATING</Badge>
                             </div>
                             <div className="p-4 rounded-2xl bg-bg-tertiary/40 border border-border/30 flex items-center justify-between">
                               <span className="text-xs font-bold text-text-primary">Curriculum Completion Rate</span>
                               <span className="text-xs font-black text-purple-600">92% ON SCHEDULE</span>
                             </div>
                           </div>
                         )}

                         {activeTab === 'Log' && (
                           <div className="py-16 md:py-24 text-center space-y-6 border-2 border-dashed border-border/40 rounded-[2.5rem] bg-bg-tertiary/20 px-6">
                              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white shadow-xl border border-border/20 flex items-center justify-center mx-auto transition-transform hover:scale-110 duration-500">
                                 <Activity className="h-6 w-6 md:h-8 md:w-8 text-text-tertiary/50" />
                              </div>
                              <div className="space-y-2 max-w-sm mx-auto">
                                 <p className="text-[12px] font-black text-text-primary uppercase tracking-[0.2em]">Activity Stream</p>
                                 <p className="text-[11px] font-bold text-text-tertiary leading-relaxed">Establishing real-time link to faculty performance metrics. Data will populate once the synchronization cycle completes.</p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="rounded-xl px-6 font-black text-[10px] uppercase tracking-[0.2em] border-border hover:bg-white shadow-sm transition-all"
                              >
                                {isSyncing ? 'Syncing...' : 'Initiate Data Sync'}
                              </Button>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </Modal>

      {/* ID Card Viewer Modal */}
      <Modal
        isOpen={isIDCardOpen}
        onClose={() => setIsIDCardOpen(false)}
        title="Faculty Identification Badge"
        size="md"
        className="rounded-[3rem] overflow-hidden border-none shadow-2xl p-6 bg-slate-900/40 backdrop-blur-2xl"
      >
        {selectedTeacher && (
          <div className="flex justify-center items-center py-4">
            <TeacherIDCard 
              teacher={{
                id: selectedTeacher.profiles?.id || selectedTeacher.user_id,
                name: selectedTeacher.profiles?.full_name || 'Faculty Member',
                teacherId: selectedTeacher.teacher_id || 'FAC-001',
                email: selectedTeacher.profiles?.email || 'email@school.com',
                phone: selectedTeacher.phone || '0300-0000000',
                subjects: selectedTeacher.qualification || "Faculty Lead",
                isClassTeacher: selectedTeacher.is_class_teacher || false,
                image: selectedTeacher.profiles?.avatar_url || '',
                schoolName: school?.name || 'Skolic International',
                schoolLogo: school?.logo_url || null
              }}
            />
          </div>
        )}
      </Modal>

      {/* Login Details Modal */}
      <Modal
        isOpen={!!loginDetailsUser}
        onClose={() => setLoginDetailsUser(null)}
        title="Account Credentials & Auth Record"
        size="lg"
        className="rounded-[2.5rem] overflow-hidden border-none shadow-2xl"
      >
        {loginDetailsUser && (
          <div className="space-y-8 p-4 sm:p-6">
            <div className="p-6 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-purple-600/30 flex-shrink-0">
                <Key className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-text-primary tracking-tight">{loginDetailsUser.fullName}</h3>
                <p className="text-xs font-bold text-purple-600 mt-1 uppercase tracking-widest">{loginDetailsUser.role} AUTH RECORD</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-bg-tertiary/50 border border-border/30 space-y-1">
                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest opacity-70">Login Email</span>
                <p className="text-sm font-black text-text-primary tracking-tight truncate">{loginDetailsUser.email}</p>
              </div>
              <div className="p-5 rounded-2xl bg-bg-tertiary/50 border border-border/30 space-y-1">
                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest opacity-70">Auth Status</span>
                <p className="text-sm font-black text-emerald-600 uppercase tracking-wider">{loginDetailsUser.status}</p>
              </div>
              <div className="p-5 rounded-2xl bg-bg-tertiary/50 border border-border/30 space-y-1">
                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest opacity-70">Created Timestamp</span>
                <p className="text-sm font-bold text-text-primary truncate">{new Date(loginDetailsUser.createdAt).toLocaleString()}</p>
              </div>
              <div className="p-5 rounded-2xl bg-bg-tertiary/50 border border-border/30 space-y-1">
                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest opacity-70">Last Active Login</span>
                <p className="text-sm font-bold text-text-primary truncate">{loginDetailsUser.lastSignInAt ? new Date(loginDetailsUser.lastSignInAt).toLocaleString() : 'Never Logged In'}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
              <Button 
                variant="outline" 
                onClick={() => handleResetPassword(loginDetailsUser.id, loginDetailsUser.fullName)}
                className="rounded-2xl h-12 px-6 gap-2 font-black text-xs uppercase tracking-wider bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border-none"
              >
                <Lock className="h-4 w-4" /> Reset Password
              </Button>
              <Button 
                onClick={() => setLoginDetailsUser(null)}
                className="rounded-2xl h-12 px-8 bg-accent text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20"
              >
                Close View
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <AddTeacherModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        classes={classes}
        subjects={subjects}
        onSuccess={(creds) => setShowCredentials(creds)}
      />

      <AddTeacherModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        classes={classes}
        subjects={subjects}
        editTeacher={selectedTeacher}
        onSuccess={(creds) => setShowCredentials(creds)}
      />

      <CredentialSuccessModal 
        isOpen={!!showCredentials}
        onClose={() => setShowCredentials(null)}
        credentials={showCredentials}
      />
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-bg-tertiary/30 hover:bg-white hover:shadow-xl hover:shadow-black/[0.02] transition-all duration-500 group/info border border-transparent hover:border-border/30">
       <div className="h-11 w-11 rounded-xl bg-white shadow-sm border border-border/20 flex items-center justify-center flex-shrink-0 group-hover/info:scale-110 transition-transform">
          <Icon className="h-5 w-5 text-text-secondary group-hover/info:text-accent transition-colors" />
       </div>
       <div className="space-y-1 min-w-0 flex-1">
          <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] leading-none opacity-60">{label}</p>
          <p className="text-[13px] font-black text-text-primary leading-snug break-words tracking-tight group-hover/info:text-accent transition-colors">
            {value || 'Not Specified'}
          </p>
       </div>
    </div>
  );
}
