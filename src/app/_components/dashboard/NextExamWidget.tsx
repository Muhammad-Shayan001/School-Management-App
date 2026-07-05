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

  if (isLoading) return <div className="h-24 bg-slate-100 animate-pulse rounded-3xl border border-slate-200" />;
  
  if (!nextExam) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-5 text-center shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700 mb-2">Schedule</p>
        <p className="text-sm font-bold text-emerald-900">No upcoming exams yet 🎉</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.24)] group">
      <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform duration-500 group-hover:scale-110">
        <Calendar className="h-24 w-24" />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-2">Upcoming Assessment</p>
        <h3 className="text-xl font-black tracking-tight mb-4 leading-snug">{nextExam.subjects?.name}</h3>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
            <Calendar className="h-3.5 w-3.5 text-white/80" />
            <span className="text-[11px] font-semibold">{formatDate(nextExam.exam_date)}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
            <Clock className="h-3.5 w-3.5 text-white/80" />
            <span className="text-[11px] font-semibold">
              {nextExam.start_time ? nextExam.start_time.slice(0,5) : 'TBA'}
            </span>
          </div>
        </div>

        <Link href="/student/exam-timetable" className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/90 hover:text-white transition-all hover:gap-3">
          View Timetable <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
