'use client';

import { useState, useEffect } from 'react';
import { getRelevantAnnouncements } from '@/app/_lib/actions/announcements';
import { Badge } from '@/app/_components/ui/badge';
import { Card } from '@/app/_components/ui/card';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { 
  Megaphone, Calendar, Clock, BellRing, 
  Target, FileText, AlertTriangle, Info, Sparkles
} from 'lucide-react';
import { formatDate } from '@/app/_lib/utils/format';
import { cn } from '@/app/_lib/utils/cn';

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRelevantAnnouncements().then(res => {
      setAnnouncements(res.data || []);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-5xl mx-auto">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
           <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
             <BellRing className="h-3 w-3" /> Staff Briefing Board
           </div>
        </div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter">Official Notices</h1>
        <p className="text-text-secondary font-medium">Important updates and directives for faculty</p>
      </div>

      {announcements.length === 0 ? (
        <Card className="py-20 text-center glass-card border-dashed">
          <Megaphone className="h-12 w-12 text-text-tertiary mx-auto mb-4 opacity-10" />
          <p className="font-black text-text-secondary">No active announcements for you right now</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {announcements.map((ann) => (
            <Card key={ann.id} className="group p-0 border-none shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white">
              <div className="flex flex-col md:flex-row">
                <div className={cn(
                  "w-full md:w-2 min-h-[4px] md:min-h-full transition-all duration-500",
                  ann.priority === 'urgent' ? "bg-red-500" : 
                  ann.priority === 'important' ? "bg-amber-500" : "bg-accent"
                )} />
                
                <div className="flex-1 p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={cn(
                          "font-black text-[10px] uppercase tracking-widest px-4 py-1 border-none shadow-sm",
                          ann.priority === 'urgent' ? "bg-red-500 text-white" : 
                          ann.priority === 'important' ? "bg-amber-500 text-white" : "bg-accent text-white"
                        )}>
                          {ann.priority}
                        </Badge>
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> {formatDate(ann.created_at)}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-text-primary tracking-tight leading-tight group-hover:text-accent transition-colors">
                        {ann.title}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="prose prose-sm max-w-none text-text-secondary font-medium leading-relaxed mb-8 whitespace-pre-wrap">
                    {ann.content}
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/30 pt-6">
                    <div className="flex items-center gap-4">
                      {ann.attachment_url && (
                        <a href={ann.attachment_url} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/5 text-accent text-xs font-black hover:bg-accent/10 transition-colors border border-accent/10">
                          <FileText className="h-4 w-4" /> View Attachment
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
