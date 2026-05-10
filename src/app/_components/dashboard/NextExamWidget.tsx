'use client';

import { useState, useEffect } from 'react';
import { getStudentExams } from '@/app/_lib/actions/exams';
import { Card } from '@/app/_components/ui/card';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { formatDate } from '@/app/_lib/utils/format';
import Link from 'next/link';

export function NextExamWidget() {
  const [nextExam, setNextExam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStudentExams().then(res => {
      if (res.data && res.data.length > 0) {
        // Find the absolute next exam (even if it's far in the future)
        setNextExam(res.data[0]);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <div className="h-24 bg-bg-tertiary animate-pulse rounded-2xl" />;
  
  if (!nextExam) {
    return (
      <Card className="p-5 border border-dashed border-text-tertiary/20 bg-bg-secondary/50 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Schedule</p>
        <p className="text-sm font-bold text-text-secondary">No upcoming exams 🎉</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-none bg-gradient-to-br from-accent to-accent-dark text-white shadow-lg shadow-accent/20 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
        <Calendar className="h-24 w-24" />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Upcoming Assessment</p>
        <h3 className="text-xl font-black tracking-tight mb-4">{nextExam.subjects?.name}</h3>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5">
             <Calendar className="h-3.5 w-3.5 opacity-60" />
             <span className="text-[11px] font-bold">{formatDate(nextExam.exam_date)}</span>
           </div>
           <div className="flex items-center gap-1.5">
             <Clock className="h-3.5 w-3.5 opacity-60" />
             <span className="text-[11px] font-bold">
               {nextExam.start_time ? nextExam.start_time.slice(0,5) : 'TBA'}
             </span>
           </div>
        </div>

        <Link href="/student/exam-timetable" className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:gap-3 transition-all">
          View Timetable <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}
