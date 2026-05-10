'use client';

import { useState, useEffect } from 'react';
import { getStudentExams } from '@/app/_lib/actions/exams';
import { getFullProfile } from '@/app/_lib/actions/profile';
import { Card } from '@/app/_components/ui/card';
import { Badge } from '@/app/_components/ui/badge';
import { Button } from '@/app/_components/ui/button';
import Link from 'next/link';
import { Calendar, Clock, MapPin, BookOpen, User, Bell, Sparkles } from 'lucide-react';
import { formatDate } from '@/app/_lib/utils/format';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { cn } from '@/app/_lib/utils/cn';

export default function StudentExamTimetable() {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await getStudentExams();
      setExams(res.data || []);
      
      // Check if we have class info in the results
      if (res.data && res.data.length > 0 && res.data[0].classes) {
        setClassInfo(`${res.data[0].classes.name} ${res.data[0].classes.section || ''}`);
      } else {
        // Fallback: check profile
        const { data: profile } = await getFullProfile();
        if (profile?.student?.classes) {
          setClassInfo(`${profile.student.classes.name} ${profile.student.classes.section || ''}`);
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) return <PageSpinner />;

  if (!classInfo && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="h-20 w-20 bg-accent/10 rounded-3xl flex items-center justify-center mb-6">
          <BookOpen className="h-10 w-10 text-accent" />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2">Class Not Assigned</h2>
        <p className="text-text-secondary max-w-md mb-8">
          You haven't been assigned to a class yet. Please complete your profile setup or contact your school administrator.
        </p>
        <Link href="/profile/setup">
          <Button className="btn-primary px-8 h-12 rounded-2xl">
            Complete Profile Setup
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
           <Badge className="bg-accent/10 text-accent border-none font-black px-3 py-1 uppercase text-[10px] tracking-widest flex items-center gap-2">
             <Bell className="h-3 w-3" /> Upcoming Assessments
           </Badge>
        </div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter">Exam Schedule</h1>
        <p className="text-text-secondary font-medium">Be prepared! Here is your official timetable for the current term.</p>
      </div>

      {exams.length === 0 ? (
        <Card className="p-20 flex flex-col items-center justify-center text-center border-none shadow-xl bg-white">
          <Calendar className="h-16 w-16 text-text-tertiary mb-4 opacity-20" />
          <p className="text-xl font-black text-text-primary tracking-tight">No Upcoming Exams</p>
          <p className="text-sm text-text-secondary mt-1">Your class teacher hasn't published the schedule yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam, i) => (
            <Card key={exam.id} className="group relative p-0 overflow-hidden border-none shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 bg-white">
              {/* Top Banner with Date */}
              <div className={cn(
                "p-6 flex items-center justify-between",
                i === 0 ? "bg-accent text-white" : "bg-bg-tertiary text-text-primary border-b border-border/50"
              )}>
                 <div className="flex items-center gap-3">
                   <Calendar className="h-5 w-5 opacity-60" />
                   <span className="font-black text-sm uppercase tracking-widest">{formatDate(exam.exam_date)}</span>
                 </div>
                 {i === 0 && (
                   <div className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm">
                     <Sparkles className="h-3 w-3" /> Next Up
                   </div>
                 )}
              </div>

              {/* Exam Content */}
              <div className="p-8 space-y-6">
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary mb-2">Subject</p>
                   <h3 className="text-2xl font-black text-text-primary tracking-tight">{exam.subjects?.name}</h3>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-bg-tertiary/50 border border-border/30">
                       <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                         <Clock className="h-3 w-3" /> Timing
                       </p>
                       <p className="text-sm font-black text-text-primary">
                         {exam.start_time ? exam.start_time.slice(0,5) : 'TBA'} 
                         {exam.end_time ? ` - ${exam.end_time.slice(0,5)}` : ''}
                       </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-bg-tertiary/50 border border-border/30">
                       <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                         <MapPin className="h-3 w-3" /> Room
                       </p>
                       <p className="text-sm font-black text-text-primary truncate">{exam.room || 'TBA'}</p>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-bg-tertiary border border-border/50 flex items-center justify-center">
                          <User className="h-4 w-4 text-text-tertiary" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Invigilator</p>
                          <p className="text-xs font-bold text-text-secondary">{exam.profiles?.full_name || 'Assigned Soon'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Status Indicator */}
              <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                 <BookOpen className="h-32 w-32 -mr-8 -mt-8 rotate-12" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
