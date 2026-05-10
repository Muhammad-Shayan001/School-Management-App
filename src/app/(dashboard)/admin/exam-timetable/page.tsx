'use client';

import { useState, useEffect } from 'react';
import { getExamSchedules } from '@/app/_lib/actions/exams';
import { getClasses } from '@/app/_lib/actions/schools';
import { Card } from '@/app/_components/ui/card';
import { Badge } from '@/app/_components/ui/badge';
import { 
  Search, Filter, Calendar, GraduationCap, 
  MapPin, Clock, ShieldCheck, Download, History
} from 'lucide-react';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { cn } from '@/app/_lib/utils/cn';
import { formatDate } from '@/app/_lib/utils/format';

export default function AdminExamManagement() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [examsRes, classesRes] = await Promise.all([
      getExamSchedules(),
      getClasses()
    ]);
    setExams(examsRes.data || []);
    setClasses(classesRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExams = exams.filter(exam => {
    const matchesClass = selectedClass === 'all' || exam.class_id === selectedClass;
    const matchesSearch = exam.subjects?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
               <ShieldCheck className="h-3 w-3" /> Principal's Oversight
             </div>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter">School Exam Master</h1>
          <p className="text-text-secondary font-medium">Monitor and manage academic assessments across all classes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative bg-white px-4 py-3 rounded-2xl border border-border shadow-sm flex items-center min-w-[200px]">
             <Search className="h-4 w-4 text-text-tertiary mr-3" />
             <input 
               type="text" 
               placeholder="Search subject..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-transparent border-none text-sm font-bold text-text-primary outline-none w-full"
             />
          </div>
          <div className="relative bg-white px-4 py-3 rounded-2xl border border-border shadow-sm flex items-center min-w-[200px]">
             <Filter className="h-4 w-4 text-accent mr-3" />
             <select 
               value={selectedClass}
               onChange={(e) => setSelectedClass(e.target.value)}
               className="bg-transparent border-none text-sm font-black text-text-primary outline-none w-full appearance-none cursor-pointer"
             >
               <option value="all">All Classes</option>
               {classes.map(c => (
                 <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
               ))}
             </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card className="p-0 border-none shadow-xl bg-white overflow-hidden">
         <div className="p-6 border-b border-border/50 bg-bg-secondary/20 flex items-center justify-between">
            <h3 className="text-lg font-black text-text-primary tracking-tight">Master Schedule</h3>
            <Badge className="bg-emerald-100 text-emerald-700 border-none font-black">{filteredExams.length} Exams Listed</Badge>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-bg-tertiary/50 text-[10px] font-black uppercase tracking-widest text-text-tertiary border-b border-border/50">
                  <tr>
                     <th className="px-8 py-5">Exam Details</th>
                     <th className="px-8 py-5">Class & Section</th>
                     <th className="px-8 py-5">Date & Time</th>
                     <th className="px-8 py-5">Invigilator</th>
                     <th className="px-8 py-5">Room</th>
                     <th className="px-8 py-5 text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border/30">
                  {filteredExams.length === 0 ? (
                    <tr><td colSpan={6} className="px-8 py-20 text-center opacity-30 italic font-bold">No schedules found matching criteria</td></tr>
                  ) : filteredExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-bg-secondary/30 transition-colors group">
                       <td className="px-8 py-5">
                          <div className="flex flex-col">
                             <span className="font-black text-text-primary text-base">{exam.subjects?.name}</span>
                             <span className="text-[10px] font-black text-accent uppercase tracking-wider">{exam.term}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <Badge variant="default" className="font-black border-border/50 text-text-secondary bg-bg-tertiary">
                             {exam.classes?.name} — {exam.classes?.section}
                          </Badge>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex flex-col">
                             <span className="font-bold text-text-primary">{formatDate(exam.exam_date)}</span>
                             <span className="text-xs text-text-tertiary font-bold">{exam.start_time.slice(0,5)} - {exam.end_time.slice(0,5)}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <span className="font-bold text-text-secondary">{exam.profiles?.full_name}</span>
                       </td>
                       <td className="px-8 py-5">
                          <span className="font-black text-text-primary">{exam.room || 'TBA'}</span>
                       </td>
                       <td className="px-8 py-5 text-right">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                             <CheckCircle2 className="h-3 w-3" /> Scheduled
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
