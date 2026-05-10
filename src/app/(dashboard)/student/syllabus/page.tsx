'use client';

import { useState, useEffect } from 'react';
import { getStudentSyllabi } from '@/app/_lib/actions/syllabus';
import { Badge } from '@/app/_components/ui/badge';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { BookOpen, Info } from 'lucide-react';
import SyllabusCard from '@/app/_components/syllabus/SyllabusCard';

export default function StudentSyllabusPage() {
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const result = await getStudentSyllabi();
    setSyllabi(result.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="default" className="bg-accent/5 text-accent border-accent/20 font-black px-3 py-1 uppercase text-[10px]">
               Academic Path
             </Badge>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter">Course Syllabus</h1>
          <p className="text-text-secondary font-medium mt-1">Track your learning progress and upcoming topics.</p>
        </div>
      </div>

      <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl flex gap-4 items-start">
        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Info className="h-5 w-5 text-accent" />
        </div>
        <p className="text-sm font-bold text-text-secondary leading-relaxed pt-1">
          Stay on track with your studies! Your teachers update these syllabi to help you prepare for upcoming lessons and exams. 
          Use the <span className="text-accent font-black">Timeline</span> view below to see chapter details.
        </p>
      </div>

      {syllabi.length === 0 ? (
        <div className="py-24 text-center glass-card bg-bg-secondary/30 rounded-3xl border-2 border-dashed border-border">
          <BookOpen className="h-16 w-16 text-text-tertiary/30 mx-auto mb-4" />
          <h3 className="text-xl font-black text-text-primary mb-2">No syllabus found</h3>
          <p className="text-text-secondary font-medium">Your teachers haven't uploaded any syllabus for your class yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {syllabi.map((syl) => (
            <SyllabusCard 
              key={syl.id} 
              syllabus={syl} 
              isStudent={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

