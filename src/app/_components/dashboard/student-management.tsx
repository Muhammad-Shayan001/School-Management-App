'use client';

import { useState } from 'react';
import { 
  Search, Filter, MoreVertical, Eye, Download, 
  Printer, UserPlus, CheckCircle2, XCircle, 
  ChevronRight, Calendar, Mail, Phone, MapPin,
  GraduationCap, CreditCard, ClipboardList, Activity, User, BookOpen, Info, Trash
} from 'lucide-react';
import { Badge } from '@/app/_components/ui/badge';
import { Input } from '@/app/_components/ui/input';
import { Select } from '@/app/_components/ui/select';
import { Button } from '@/app/_components/ui/button';
import { Modal } from '@/app/_components/ui/modal';
import { cn } from '@/app/_lib/utils/cn';
import Image from 'next/image';
import { AddStudentModal } from './add-student-modal';
import { CredentialSuccessModal } from './credential-success-modal';
import { generateAdmissionForm } from '@/app/_lib/utils/pdf-admission';

interface StudentManagementProps {
  students: any[];
  classes: any[];
  school?: any;
}

import { updateFeeStatus, deleteStudent } from '@/app/_lib/actions/users';
import { toast } from 'sonner';

export function StudentManagement({ students, classes, school }: StudentManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showCredentials, setShowCredentials] = useState<any>(null);
  const [isUpdatingFee, setIsUpdatingFee] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleRemoveStudent = async (studentUserId: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete ${name || 'this student'}? This will permanently remove their profile, attendance, results, fees, and account. This action cannot be undone.`)) {
      return;
    }
    
    setIsDeleting(studentUserId);
    const result = await deleteStudent(studentUserId);
    
    if (result.success) {
      toast.success(`${name || 'Student'} deleted successfully`, {
        description: 'Account and academic records have been purged.',
        style: { borderRadius: '1.5rem', fontWeight: 'bold' }
      });
      if (selectedStudent?.user_id === studentUserId) {
        setIsProfileOpen(false);
      }
    } else {
      toast.error(result.error || 'Failed to delete student');
    }
    setIsDeleting(null);
  };

  const handleFeeToggle = async (studentId: string, currentStatus: string) => {
    setIsUpdatingFee(studentId);
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    const result = await updateFeeStatus(studentId, newStatus);
    
    if (result.success) {
      toast.success(`Fee status updated to ${newStatus}`, {
        description: `Student account has been marked as ${newStatus}.`,
        style: { borderRadius: '1.5rem', fontWeight: 'bold' }
      });
    } else {
      toast.error(result.error || 'Failed to update fee status');
    }
    setIsUpdatingFee(null);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || s.class_id === classFilter;
    return matchesSearch && matchesClass;
  });

  const openProfile = (student: any) => {
    setSelectedStudent(student);
    setIsProfileOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Dynamic Filter Bar - Glass Design */}
      <div className="glass-card p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/[0.02] flex flex-col md:flex-row gap-6 items-center justify-between rounded-[2.5rem]">
        <div className="relative w-full md:w-[450px] group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary group-focus-within:text-accent transition-colors" />
          <Input 
            placeholder="Quick search by name or roll number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-14 h-14 bg-bg-tertiary/50 border-transparent focus:bg-white focus:border-accent/20 rounded-[1.5rem] transition-all duration-500 font-bold placeholder:text-text-tertiary/50 shadow-sm focus:shadow-xl"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select 
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            options={[
              { label: 'All Classes', value: 'all' },
              ...classes.map(c => ({ label: `${c.name}${c.section && c.section.toUpperCase() !== 'A' ? ` - ${c.section}` : ''}`, value: c.id }))
            ]}
            className="h-14 min-w-[200px] rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest border-transparent bg-bg-tertiary/50"
          />
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="h-14 px-8 rounded-[1.5rem] gap-3 font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-accent/20 bg-accent text-white hover:scale-105 active:scale-95 transition-all"
          >
            <UserPlus className="h-5 w-5" /> Enroll Student
          </Button>
        </div>
      </div>

      {/* Luxury Table Design */}
      <div className="glass-card bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/[0.02] overflow-hidden rounded-[3rem]">
        <div className="overflow-x-auto scrollbar-premium">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-tertiary/30 border-b border-border/40">
                <th className="px-10 py-7 text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em]">Registry</th>
                <th className="px-6 py-7 text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em]">Identity</th>
                <th className="px-6 py-7 text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em]">Classroom</th>
                <th className="px-6 py-7 text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em]">Financials</th>
                <th className="px-6 py-7 text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em]">Status</th>
                <th className="px-10 py-7 text-right text-[11px] font-black text-text-tertiary uppercase tracking-[0.25em]">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-accent/[0.02] transition-all duration-300 group cursor-default">
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-bg-tertiary to-border/30 flex-shrink-0 overflow-hidden border border-border/50 shadow-sm relative">
                        {student.profiles?.avatar_url ? (
                          <img src={student.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-accent/5 text-accent font-black text-xl uppercase">
                            {student.profiles?.full_name?.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-text-primary leading-tight group-hover:text-accent transition-colors duration-300">{student.profiles?.full_name}</p>
                        <p className="text-[11px] font-bold text-text-tertiary mt-1 lowercase opacity-70">{student.profiles?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-tertiary/50 border border-border/30 group-hover:bg-white transition-colors max-w-[120px]">
                       <span className="text-[10px] font-black text-text-tertiary uppercase opacity-50">RN</span>
                       <span className="text-xs font-black text-text-primary tracking-tight truncate">{student.roll_number || '---'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-text-primary leading-tight">{student.classes?.name || 'Pending'}</span>
                      <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mt-1 opacity-60">Section {student.classes?.section || '---'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <button
                         onClick={() => handleFeeToggle(student.user_id, student.fee_status)}
                         disabled={isUpdatingFee === student.user_id}
                         className={cn(
                           "h-6 w-11 rounded-full p-1 transition-all duration-500 relative ring-offset-2 focus:ring-2 ring-accent shadow-inner",
                           student.fee_status === 'paid' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-bg-tertiary border border-border"
                         )}
                       >
                          <div className={cn(
                            "h-4 w-4 rounded-full bg-white shadow-xl transition-all duration-500 transform",
                            student.fee_status === 'paid' ? "translate-x-5" : "translate-x-0"
                          )} />
                       </button>
                       <Badge variant={student.fee_status === 'paid' ? 'success' : 'danger'} className="uppercase text-[9px] font-black tracking-[0.2em] px-4 py-1.5 shadow-sm">
                         {student.fee_status || 'unpaid'}
                       </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "h-2.5 w-2.5 rounded-full shadow-sm animate-pulse", 
                          student.profiles?.status === 'approved' ? "bg-success shadow-success/40" : "bg-warning shadow-warning/40"
                        )} />
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.1em]">{student.profiles?.status}</span>
                     </div>
                  </td>
                  <td className="px-10 py-5 text-right">
                     <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => openProfile(student)}
                          className="h-11 w-11 rounded-2xl bg-accent/10 text-accent flex items-center justify-center hover:bg-accent hover:text-white transition-all duration-300 shadow-sm active:scale-90"
                          title="View Intelligence Profile"
                         >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleRemoveStudent(student.user_id, student.profiles?.full_name)}
                          disabled={isDeleting === student.user_id}
                          className="h-11 w-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm active:scale-90 disabled:opacity-50"
                          title="Delete Student Profile"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="py-24 text-center space-y-6">
              <div className="h-24 w-24 bg-gradient-to-br from-bg-tertiary to-white rounded-full flex items-center justify-center mx-auto shadow-inner border border-border/30">
                <Search className="h-10 w-10 text-text-tertiary/40" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-text-primary uppercase tracking-[0.25em]">No students found</p>
                <p className="text-[11px] font-bold text-text-tertiary">Adjust your search parameters and try again.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Profile Master Modal */}
      {/* Modals */}
      <AddStudentModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        classes={classes}
        onSuccess={(creds) => setShowCredentials(creds)}
      />

      <CredentialSuccessModal 
        isOpen={!!showCredentials}
        onClose={() => setShowCredentials(null)}
        credentials={showCredentials}
      />

      <Modal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        title="Student Intelligence Profile"
        size="3xl"
        className="rounded-[3rem] overflow-hidden border-none"
      >
        {selectedStudent && (
          <div className="space-y-10 max-h-[85vh] overflow-y-auto pr-3 scrollbar-premium animate-in fade-in slide-in-from-top-4 duration-700 pb-10">
             {/* Dynamic Banner Header */}
             <div className="relative p-8 md:p-10 rounded-[3rem] bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/10 flex flex-col md:flex-row items-center gap-8 md:gap-10 overflow-hidden group/header">
                <div className="absolute -top-32 -right-32 h-80 w-80 bg-accent/5 rounded-full blur-3xl pointer-events-none group-hover/header:scale-125 transition-transform duration-1000" />
                
                <div className="relative z-10 h-32 w-32 md:h-40 md:w-40 rounded-[2.5rem] bg-white p-1.5 shadow-2xl transition-transform duration-700 hover:rotate-3 flex-shrink-0">
                   <div className="h-full w-full rounded-[2.2rem] overflow-hidden bg-bg-tertiary relative">
                     {selectedStudent.profiles?.avatar_url ? (
                        <img src={selectedStudent.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-4xl md:text-5xl font-black text-accent uppercase">
                          {selectedStudent.profiles?.full_name?.charAt(0)}
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
                      <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter leading-tight break-words max-w-full">{selectedStudent.profiles?.full_name}</h2>
                      <Badge variant="accent" className="uppercase text-[10px] font-black tracking-[0.3em] px-5 py-1.5 shadow-xl shadow-accent/20">STUDENT</Badge>
                   </div>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-3 text-sm font-bold text-text-secondary opacity-80">
                      <div className="flex items-center gap-3 min-w-0">
                         <div className="h-2 w-2 rounded-full bg-accent animate-pulse flex-shrink-0" /> 
                         <span className="font-black text-text-primary truncate">{selectedStudent.classes?.name || 'Class'}</span> 
                         <span className="opacity-50 flex-shrink-0">•</span> 
                         <span className="truncate">Section {selectedStudent.classes?.section || '---'}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                         <div className="h-2 w-2 rounded-full bg-emerald-500" /> 
                         <span className="font-black text-text-primary tracking-widest uppercase">Roll {selectedStudent.roll_number || 'N/A'}</span>
                      </div>
                   </div>
                </div>

                <div className="md:ml-auto flex flex-wrap gap-3 relative z-10 w-full md:w-auto justify-center md:justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => generateAdmissionForm(selectedStudent, school)}
                      className="rounded-2xl h-12 md:h-14 px-6 md:px-8 gap-3 font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] bg-white hover:shadow-xl transition-all border-border/50"
                    >
                       <Download className="h-4 w-4 md:h-5 md:w-5 text-accent" /> Admission Form
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleRemoveStudent(selectedStudent.user_id, selectedStudent.profiles?.full_name)}
                      disabled={isDeleting === selectedStudent.user_id}
                      className="rounded-2xl h-12 md:h-14 px-6 md:px-8 gap-3 font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border-red-200"
                    >
                       <Trash className="h-4 w-4 md:h-5 md:w-5" /> Delete Student
                    </Button>
                 </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                {/* Information Silos */}
                <div className="lg:col-span-1 space-y-8">
                   <div className="glass-card p-6 md:p-8 bg-white/50 border border-white/40 shadow-xl shadow-black/[0.01] rounded-[2.5rem]">
                      <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6 md:mb-8 flex items-center gap-3">
                        <div className="h-1 w-4 bg-accent rounded-full" /> Personal Dossier
                      </h4>
                      <div className="space-y-4 md:space-y-5">
                         <InfoItem icon={Mail} label="Contact Email" value={selectedStudent.profiles?.email} />
                         <InfoItem icon={Phone} label="Emergency Contact" value={selectedStudent.sms_phone || selectedStudent.phone} />
                         <InfoItem icon={Calendar} label="Date of Birth" value={selectedStudent.dob} />
                         <InfoItem icon={User} label="Gender Category" value={selectedStudent.gender} />
                         <InfoItem icon={MapPin} label="Residential Node" value={selectedStudent.address} />
                         <InfoItem icon={Activity} label="Blood Group" value={selectedStudent.blood_group} />
                         <InfoItem icon={BookOpen} label="Reg No" value={selectedStudent.registration_no} />
                         <InfoItem icon={User} label="Student Cast" value={selectedStudent.student_cast} />
                      </div>
                   </div>

                   <div className="glass-card p-6 md:p-8 bg-white/50 border border-white/40 shadow-xl shadow-black/[0.01] rounded-[2.5rem]">
                      <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6 md:mb-8 flex items-center gap-3">
                        <div className="h-1 w-4 bg-emerald-500 rounded-full" /> Guardian Core
                      </h4>
                      <div className="space-y-4 md:space-y-5">
                         <InfoItem icon={User} label="Father / Guardian" value={selectedStudent.father_name || selectedStudent.parent_name} />
                         <InfoItem icon={Phone} label="Guardian Uplink" value={selectedStudent.father_phone || selectedStudent.parent_phone} />
                         <InfoItem icon={CreditCard} label="Father CNIC" value={selectedStudent.father_cnic || selectedStudent.parent_cnic} />
                         <InfoItem icon={User} label="Mother Name" value={selectedStudent.mother_name} />
                      </div>
                   </div>
                </div>

                {/* Analytical Modules */}
                <div className="lg:col-span-2 space-y-8">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                      <div className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/10 flex items-center justify-between group/metric hover:bg-white hover:shadow-2xl transition-all duration-700 cursor-default min-w-0 overflow-hidden">
                         <div className="flex items-center gap-4 md:gap-5 min-w-0">
                            <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover/metric:scale-110 transition-transform flex-shrink-0">
                               <Activity className="h-6 w-6 md:h-7 md:w-7" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.25em] mb-1">Attendance</p>
                               <p className="text-xl md:text-2xl font-black text-text-primary tracking-tighter truncate">92.4% <span className="text-[9px] font-black text-success uppercase tracking-widest ml-2 px-2 py-0.5 bg-success/10 rounded-full">Optimal</span></p>
                            </div>
                         </div>
                      </div>
                      <div className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/10 flex items-center justify-between group/fee hover:bg-white hover:shadow-2xl transition-all duration-700 cursor-default min-w-0 overflow-hidden">
                         <div className="flex items-center gap-4 md:gap-5 min-w-0">
                            <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover/fee:scale-110 transition-transform flex-shrink-0">
                               <CreditCard className="h-6 w-6 md:h-7 md:w-7" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.25em] mb-1">Financials</p>
                               <p className="text-xl md:text-2xl font-black text-text-primary uppercase tracking-tighter truncate">{selectedStudent.fee_status || 'Unpaid'}</p>
                            </div>
                         </div>
                         <button
                           onClick={() => handleFeeToggle(selectedStudent.user_id, selectedStudent.fee_status)}
                           disabled={isUpdatingFee === selectedStudent.user_id}
                           className={cn(
                             "h-7 w-12 rounded-full p-1.5 transition-all duration-500 relative ring-offset-2 focus:ring-2 ring-accent shadow-inner flex-shrink-0",
                             selectedStudent.fee_status === 'paid' ? "bg-emerald-500" : "bg-bg-tertiary border border-border"
                           )}
                         >
                            <div className={cn(
                              "h-4 w-4 rounded-full bg-white shadow-xl transition-all duration-500 transform",
                              selectedStudent.fee_status === 'paid' ? "translate-x-5" : "translate-x-0"
                            )} />
                         </button>
                      </div>
                   </div>

                   {/* Intelligence Tabs */}
                   <div className="glass-card p-6 md:p-10 bg-white border border-border/30 shadow-2xl shadow-black/[0.01] rounded-[3rem] relative overflow-hidden">
                      <div className="flex items-center gap-6 md:gap-10 border-b border-border/40 mb-8 md:mb-10 overflow-x-auto scrollbar-hide">
                         {['Attendance', 'Results', 'Assignments', 'Schedule'].map((tab, i) => (
                           <button 
                             key={i} 
                             className={cn(
                               "pb-5 md:pb-6 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] transition-all relative group flex-shrink-0",
                               i === 0 ? "text-accent" : "text-text-tertiary hover:text-text-primary"
                             )}
                           >
                              {tab}
                              {i === 0 && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full animate-in fade-in slide-in-from-left-2 duration-500" />}
                           </button>
                         ))}
                      </div>

                      <div className="space-y-8 animate-in fade-in duration-1000">
                         {/* High-end empty state / log viewer */}
                         <div className="py-16 md:py-24 text-center space-y-6 border-2 border-dashed border-border/40 rounded-[2.5rem] bg-bg-tertiary/20 px-6">
                            <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white shadow-xl border border-border/20 flex items-center justify-center mx-auto transition-transform hover:scale-110 duration-500">
                               <ClipboardList className="h-6 w-6 md:h-8 md:w-8 text-text-tertiary/50" />
                            </div>
                            <div className="space-y-2 max-w-sm mx-auto">
                               <p className="text-[12px] font-black text-text-primary uppercase tracking-[0.2em]">Activity Log Offline</p>
                               <p className="text-[11px] font-bold text-text-tertiary leading-relaxed">Establishing connection to the academic data stream. Historical logs will populate once synchronization is complete.</p>
                               <Button variant="outline" size="sm" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-[0.2em] border-border hover:bg-white shadow-sm transition-all">
                                 Initiate Sync
                               </Button>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </Modal>

      <CredentialSuccessModal 
        isOpen={!!showCredentials}
        onClose={() => setShowCredentials(null)}
        credentials={showCredentials}
      />

      <AddStudentModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        classes={classes}
        onSuccess={(creds) => setShowCredentials(creds)}
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
