'use client';

import { useState } from 'react';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { 
  BookOpen, Trash2, Calendar, User, CheckCircle2, 
  ChevronDown, ChevronUp, Clock, BarChart, GraduationCap 
} from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';
import { toggleChapterCompletion } from '@/app/_lib/actions/syllabus';

interface SyllabusCardProps {
  syllabus: any;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
  isAdmin?: boolean;
  isStudent?: boolean;
}

export default function SyllabusCard({ syllabus, onDelete, isOwner, isAdmin, isStudent }: SyllabusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localChapters, setLocalChapters] = useState(syllabus.syllabus_chapters || []);
  
  const completedCount = localChapters.filter((ch: any) => ch.is_completed).length;
  const progress = localChapters.length > 0 ? Math.round((completedCount / localChapters.length) * 100) : 0;

  const handleToggleComplete = async (chapterId: string, currentStatus: boolean) => {
    if (isStudent) return; // Students can't mark as complete
    
    // Optimistic update
    setLocalChapters((prev: any[]) => prev.map((ch: any) => 
      ch.id === chapterId ? { ...ch, is_completed: !currentStatus } : ch
    ));

    await toggleChapterCompletion(chapterId, !currentStatus);
  };

  return (
    <Card className="p-0 border-none shadow-xl bg-white overflow-hidden flex flex-col group transition-all hover:shadow-2xl hover:-translate-y-1 duration-300">
      {/* Progress Bar Header */}
      <div className="h-1.5 w-full bg-bg-tertiary">
        <div 
          className="h-full bg-accent transition-all duration-1000 ease-out" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
            <Badge className="bg-accent/10 text-accent font-black tracking-widest uppercase text-[10px] border-none px-3 py-1">
              {syllabus.academic_session}
            </Badge>
            <Badge className={cn(
              "font-black tracking-widest uppercase text-[10px] border-none px-3 py-1",
              progress === 100 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
            )}>
              {progress === 100 ? 'Completed' : `In Progress (${progress}%)`}
            </Badge>
          </div>
          
          {(isOwner || isAdmin) && onDelete && (
            <button 
              onClick={() => {
                if (confirm('Delete this syllabus? This action cannot be undone.')) {
                  onDelete(syllabus.id);
                }
              }} 
              className="h-8 w-8 flex items-center justify-center rounded-full text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <h3 className="text-2xl font-black text-text-primary tracking-tight mb-4 group-hover:text-accent transition-colors">
          {syllabus.title}
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-secondary/50 border border-border/50">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <GraduationCap className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-text-tertiary tracking-widest">Class</p>
              <p className="text-xs font-black text-text-primary">{syllabus.classes?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-secondary/50 border border-border/50">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-text-tertiary tracking-widest">Subject</p>
              <p className="text-xs font-black text-text-primary">{syllabus.subjects?.name}</p>
            </div>
          </div>
        </div>

        {!isStudent && (
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-accent/5 border border-accent/10">
             <div className="h-10 w-10 rounded-full border-2 border-white shadow-sm bg-accent flex items-center justify-center text-white font-black text-sm">
               {syllabus.teacher?.full_name?.charAt(0) || 'T'}
             </div>
             <div>
               <p className="text-[9px] font-black uppercase text-accent tracking-widest">Instructor</p>
               <p className="text-sm font-black text-text-primary">{syllabus.teacher?.full_name || 'Assigned Teacher'}</p>
             </div>
          </div>
        )}

        <div className="border-t border-border/50 pt-4 mt-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex justify-between items-center text-sm font-black text-text-secondary hover:text-accent transition-colors"
          >
            <span className="flex items-center gap-2">
              <BarChart className="h-4 w-4" /> Course Timeline
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {isExpanded && (
            <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
              {localChapters.map((ch: any, idx: number) => (
                <div key={ch.id} className="relative pl-8 pb-2">
                  {/* Vertical Line */}
                  {idx !== localChapters.length - 1 && (
                    <div className={cn(
                      "absolute top-6 left-[11px] w-0.5 h-full transition-colors duration-500",
                      ch.is_completed ? "bg-success" : "bg-border"
                    )} />
                  )}
                  
                  {/* Completion Dot */}
                  <button 
                    disabled={isStudent}
                    onClick={() => handleToggleComplete(ch.id, ch.is_completed)}
                    className={cn(
                      "absolute top-0 left-0 h-6 w-6 rounded-full border-2 z-10 flex items-center justify-center transition-all duration-300 shadow-sm",
                      ch.is_completed 
                        ? "bg-success border-success text-white scale-110" 
                        : "bg-white border-border text-transparent hover:border-accent hover:text-accent/30"
                    )}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                  </button>

                  <div className={cn(
                    "p-4 rounded-2xl border transition-all duration-300",
                    ch.is_completed ? "bg-success/5 border-success/20 opacity-80" : "bg-white border-border/60 shadow-sm"
                  )}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                      <h5 className={cn(
                        "font-black text-sm tracking-tight",
                        ch.is_completed ? "text-success line-through decoration-2" : "text-text-primary"
                      )}>
                        {idx + 1}. {ch.title}
                      </h5>
                      {(ch.start_date || ch.end_date) && (
                        <span className="text-[9px] font-black text-text-tertiary flex items-center gap-1.5 bg-bg-tertiary/50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          {ch.start_date ? new Date(ch.start_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : '??'} 
                          {' → '} 
                          {ch.end_date ? new Date(ch.end_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : '??'}
                        </span>
                      )}
                    </div>
                    {ch.description && (
                      <p className="text-xs font-medium text-text-secondary leading-relaxed line-clamp-3">
                        {ch.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {localChapters.length === 0 && (
                <div className="text-center py-8 text-text-tertiary italic text-sm bg-bg-secondary/30 rounded-2xl border-2 border-dashed border-border/50">
                  No modules defined for this course.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
