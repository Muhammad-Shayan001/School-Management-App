'use client';

import { useState, useEffect } from 'react';
import { getAllAnnouncements, createAnnouncement, deleteAnnouncement } from '@/app/_lib/actions/announcements';
import { getClasses } from '@/app/_lib/actions/schools';
import { Badge } from '@/app/_components/ui/badge';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { 
  Megaphone, Plus, Trash2, Calendar, Users, 
  AlertTriangle, Info, BellRing, Target, FileText,
  Search, Filter, ChevronRight, X, Sparkles, Clock
} from 'lucide-react';
import { formatDate } from '@/app/_lib/utils/format';
import { cn } from '@/app/_lib/utils/cn';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'normal' | 'important' | 'urgent',
    target_type: 'all' as 'all' | 'teachers' | 'students' | 'class',
    target_id: '',
    expires_at: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    const [annRes, classRes] = await Promise.all([
      getAllAnnouncements(),
      getClasses()
    ]);
    setAnnouncements(annRes.data || []);
    setClasses(classRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createAnnouncement(formData);
    if (res.success) {
      setShowModal(false);
      setFormData({
        title: '', content: '', priority: 'normal',
        target_type: 'all', target_id: '', expires_at: ''
      });
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this announcement?')) {
      const res = await deleteAnnouncement(id);
      if (res.success) fetchData();
    }
  };

  const filteredAnnouncements = announcements.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && announcements.length === 0) return <PageSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
               <BellRing className="h-3 w-3" /> Communication Hub
             </div>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter flex items-center gap-3">
             Notices & Alerts
          </h1>
          <p className="text-text-secondary font-medium">Broadcast messages across the school campus</p>
        </div>

        <Button 
          onClick={() => setShowModal(true)}
          className="bg-accent hover:bg-accent-dark text-white rounded-2xl px-6 h-12 shadow-lg shadow-accent/20 font-black flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" /> New Announcement
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Summary Stats */}
        <div className="lg:col-span-1 space-y-4">
           <Card className="p-8 bg-gradient-to-br from-white to-bg-secondary border-none shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Megaphone className="h-32 w-32 rotate-12" />
             </div>
             <div className="relative z-10 space-y-6">
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Active Messages</p>
                 <h2 className="text-3xl font-black text-text-primary">{announcements.length}</h2>
               </div>
               
               <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                   <span className="text-xs font-bold text-red-700 flex items-center gap-2">
                     <AlertTriangle className="h-4 w-4" /> Urgent
                   </span>
                   <span className="font-black text-red-800">{announcements.filter(a => a.priority === 'urgent').length}</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                   <span className="text-xs font-bold text-amber-700 flex items-center gap-2">
                     <Info className="h-4 w-4" /> Important
                   </span>
                   <span className="font-black text-amber-800">{announcements.filter(a => a.priority === 'important').length}</span>
                 </div>
               </div>
             </div>
           </Card>

           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary group-focus-within:text-accent transition-colors" />
              <input 
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-border/50 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-accent/5 focus:border-accent transition-all"
              />
           </div>
        </div>

        {/* Right: List of Announcements */}
        <div className="lg:col-span-2 space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <Card className="py-20 text-center glass-card border-dashed">
              <Megaphone className="h-12 w-12 text-text-tertiary mx-auto mb-4 opacity-20" />
              <p className="font-black text-text-secondary">No announcements found</p>
            </Card>
          ) : (
            filteredAnnouncements.map((ann) => (
              <Card key={ann.id} className="group p-0 border-none shadow-xl overflow-hidden hover:scale-[1.01] transition-all duration-300">
                <div className="flex">
                  {/* Priority Indicator */}
                  <div className={cn(
                    "w-2 transition-all duration-500",
                    ann.priority === 'urgent' ? "bg-red-500" : 
                    ann.priority === 'important' ? "bg-amber-500" : "bg-accent"
                  )} />
                  
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <Badge variant={ann.priority === 'urgent' ? 'danger' : ann.priority === 'important' ? 'warning' : 'accent'} className="font-black text-[9px] uppercase tracking-widest px-3">
                            {ann.priority}
                          </Badge>
                          <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-1">
                            <Target className="h-3 w-3" /> {ann.target_type} {ann.target_id ? '— Targeted' : ''}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight group-hover:text-accent transition-colors">{ann.title}</h3>
                      </div>
                      <button 
                        onClick={() => handleDelete(ann.id)}
                        className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-text-secondary font-medium leading-relaxed mb-6 line-clamp-3">
                      {ann.content}
                    </p>
                    
                    <div className="flex items-center justify-between border-t border-border/30 pt-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-tertiary">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(ann.created_at)}
                        </div>
                        {ann.expires_at && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-400">
                            <Clock className="h-3.5 w-3.5" />
                            Expires {formatDate(ann.expires_at)}
                          </div>
                        )}
                      </div>
                      {ann.attachment_url && (
                         <Badge variant="default" className="gap-1.5 border-accent/20 text-accent bg-accent/5">
                           <FileText className="h-3 w-3" /> Attached File
                         </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <Card className="relative w-full max-w-2xl bg-white border-none shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-accent p-8 text-white relative">
               <Sparkles className="absolute top-4 right-4 h-12 w-12 opacity-10 rotate-12" />
               <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                 <Megaphone className="h-7 w-7" /> Create New Notice
               </h2>
               <p className="text-white/80 font-medium text-sm mt-1">Compose and target your announcement carefully</p>
               <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-all">
                 <X className="h-5 w-5" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Notice Title</label>
                   <input 
                     required
                     value={formData.title}
                     onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                     className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent"
                     placeholder="e.g. Annual Sports Gala 2026"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Priority Level</label>
                   <select 
                     value={formData.priority}
                     onChange={(e: any) => setFormData({ ...formData, priority: e.target.value })}
                     className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent appearance-none"
                   >
                     <option value="normal">Normal</option>
                     <option value="important">Important</option>
                     <option value="urgent">Urgent</option>
                   </select>
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Detailed Content</label>
                 <textarea 
                   required
                   value={formData.content}
                   onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                   rows={4}
                   className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent resize-none"
                   placeholder="Write your message here..."
                 />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Target Audience</label>
                   <select 
                     value={formData.target_type}
                     onChange={(e: any) => setFormData({ ...formData, target_type: e.target.value })}
                     className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent"
                   >
                     <option value="all">Everyone (School-wide)</option>
                     <option value="teachers">Only Teachers</option>
                     <option value="students">Only Students</option>
                     <option value="class">Specific Class</option>
                   </select>
                 </div>

                 {formData.target_type === 'class' && (
                   <div className="space-y-1 animate-in slide-in-from-top-2">
                     <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Select Class</label>
                     <select 
                       required
                       value={formData.target_id}
                       onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                       className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent"
                     >
                       <option value="">— Select Class —</option>
                       {classes.map((c) => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                       ))}
                     </select>
                   </div>
                 )}
                 
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Expiry Date (Optional)</label>
                   <input 
                     type="date"
                     value={formData.expires_at}
                     onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                     className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent"
                   />
                 </div>
               </div>

               <Button 
                 type="submit" 
                 isLoading={isSubmitting}
                 className="w-full h-14 bg-accent hover:bg-accent-dark text-white rounded-2xl font-black text-lg shadow-xl shadow-accent/20 transition-all active:scale-[0.98]"
               >
                 Broadcast Announcement
               </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
