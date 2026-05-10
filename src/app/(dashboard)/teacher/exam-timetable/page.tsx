'use client';

import { useState, useEffect } from 'react';
import { getExamSchedules, createExam, deleteExam } from '@/app/_lib/actions/exams';
import { getFullProfile } from '@/app/_lib/actions/profile';
import { getTeacherAssignments } from '@/app/_lib/actions/results';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { 
  Calendar, Clock, MapPin, Trash2, Plus, 
  GraduationCap, BookOpen, AlertCircle, Sparkles, CheckCircle2 
} from 'lucide-react';
import { formatDate } from '@/app/_lib/utils/format';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { cn } from '@/app/_lib/utils/cn';

export default function ExamSchedulePage() {
  const [exams, setExams] = useState<any[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    subject_id: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    room: '',
    term: 'Final Term'
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async (classIdToFetch?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    const [profileRes, assignmentsRes] = await Promise.all([
      getFullProfile(),
      getTeacherAssignments()
    ]);
    
    setTeacherProfile(profileRes.data);
    
    let activeAssignments = [];
    if (assignmentsRes.data) {
       activeAssignments = assignmentsRes.data;
       setAssignments(activeAssignments);
       
       const classMap = new Map();
       activeAssignments.forEach((a: any) => {
         if (a.classes && a.classes.id) {
           classMap.set(a.classes.id, a.classes);
         }
       });
       const classList = Array.from(classMap.values());
       setClasses(classList);

       let initialClassId = classIdToFetch || '';
       if (!initialClassId && classList.length > 0) {
         initialClassId = classList[0].id;
       }
       setSelectedClassId(initialClassId);

       if (initialClassId) {
         fetchExamsForClass(initialClassId);
         updateSubjectsForClass(initialClassId, activeAssignments);
       } else {
         setIsLoading(false);
       }
    } else {
      setIsLoading(false);
    }
  };

  const updateSubjectsForClass = (classId: string, currentAssignments: any[]) => {
    const subjectMap = new Map();
    currentAssignments.forEach((a: any) => {
      if (a.class_id === classId && a.subjects && a.subjects.id) {
        subjectMap.set(a.subjects.id, a.subjects);
      }
    });
    setSubjects(Array.from(subjectMap.values()));
  };

  const fetchExamsForClass = async (classId: string) => {
    const examsRes = await getExamSchedules({ 
      class_id: classId,
      term: 'Final Term'
    });
    setExams(examsRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClassId = e.target.value;
    setSelectedClassId(newClassId);
    setFormData({ ...formData, subject_id: '' });
    updateSubjectsForClass(newClassId, assignments);
    fetchExamsForClass(newClassId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClassId) {
      setErrorMessage("Please select a class first.");
      return;
    }

    if (!formData.subject_id || !formData.exam_date || !formData.start_time || !formData.end_time) {
      setErrorMessage("Please fill in all required fields (Subject, Date, and Times).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      const res = await createExam({
        ...formData,
        class_id: selectedClassId
      });

      if (res.success) {
        setFormData({ ...formData, subject_id: '', room: '' });
        alert('Exam schedule entry saved successfully!');
        await fetchExamsForClass(selectedClassId);
      } else {
        setErrorMessage(res.error || 'Failed to create exam');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this exam from the schedule?')) return;
    const res = await deleteExam(id);
    if (res.success && selectedClassId) fetchExamsForClass(selectedClassId);
  };

  if (isLoading) return <PageSpinner />;

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-black text-text-primary">No Classes Assigned</h2>
        <p className="text-text-secondary mt-2 max-w-md">
          You have not been assigned to any classes yet. Please contact the administrator.
        </p>
      </div>
    );
  }

  const selectedClassInfo = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="default" className="bg-accent/5 text-accent border-accent/20 font-black px-3 py-1 uppercase text-[10px]">
               {selectedClassInfo ? `${selectedClassInfo.name} — ${selectedClassInfo.section}` : 'N/A'}
             </Badge>
             <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Exam Builder</span>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter">Academic Timetable</h1>
          <p className="text-text-secondary font-medium">Schedule subjects and dates for the upcoming examinations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="xl:col-span-1">
          <Card className="p-8 border-none shadow-xl bg-white sticky top-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Plus className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-text-primary tracking-tight">Add Exam</h2>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center gap-3 animate-shake">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-xs font-bold">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Select Class</label>
                <select
                  required
                  value={selectedClassId}
                  onChange={handleClassChange}
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Select Subject</label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent"
                >
                  <option value="">— Choose Subject —</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.exam_date}
                    onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Room / Hall</label>
                <input
                  type="text"
                  placeholder="e.g. Hall A, Room 302"
                  value={formData.room}
                  onChange={(e) => setFormData({...formData, room: e.target.value})}
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl font-bold outline-none focus:border-accent"
                />
              </div>

              <Button 
                type="submit" 
                isLoading={isSubmitting}
                className="w-full h-14 bg-accent hover:bg-accent-dark text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-accent/20"
              >
                Save Exam Entry
              </Button>
            </form>
          </Card>
        </div>

        {/* Schedule List */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="p-0 border-none shadow-xl bg-white overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-6 border-b border-border/50 bg-bg-secondary/20 flex items-center justify-between">
               <h3 className="text-xl font-black text-text-primary tracking-tight flex items-center gap-2">
                 <BookOpen className="h-5 w-5 text-accent" /> {formData.term} Schedule
               </h3>
               <Badge className="bg-accent/10 text-accent border-none font-black">{exams.length} Exams</Badge>
            </div>

            <div className="flex-1">
              {exams.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                  <Calendar className="h-16 w-16 text-text-tertiary mb-4 opacity-20" />
                  <p className="text-lg font-black text-text-primary">No Exams Scheduled</p>
                  <p className="text-sm text-text-secondary mt-1">Start adding subjects to build the timetable.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {exams.map((exam) => (
                    <div key={exam.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-bg-tertiary/20 transition-colors group">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-bg-tertiary flex flex-col items-center justify-center border border-border/50 shadow-sm">
                           <span className="text-[10px] font-black text-text-tertiary uppercase">{new Date(exam.exam_date).toLocaleString('default', { month: 'short' })}</span>
                           <span className="text-2xl font-black text-text-primary leading-none">{new Date(exam.exam_date).getDate()}</span>
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-text-primary tracking-tight">{exam.subjects?.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-text-tertiary">
                             <span className="flex items-center gap-1.5 text-xs font-bold">
                               <Clock className="h-3.5 w-3.5" /> {exam.start_time.slice(0, 5)} - {exam.end_time.slice(0, 5)}
                             </span>
                             {exam.room && (
                               <span className="flex items-center gap-1.5 text-xs font-bold border-l pl-4 border-border">
                                 <MapPin className="h-3.5 w-3.5" /> {exam.room}
                               </span>
                             )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                           <CheckCircle2 className="h-3 w-3" /> Confirmed
                         </div>
                         {exam.teacher_id === teacherProfile?.id && (
                           <button 
                             onClick={() => handleDelete(exam.id)}
                             className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                             title="Delete Exam"
                           >
                             <Trash2 className="h-5 w-5" />
                           </button>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-bg-tertiary/30 border-t border-border/50">
               <div className="flex items-center gap-3 text-text-tertiary">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <p className="text-xs font-bold leading-relaxed italic">
                    This schedule is instantly visible to all students in <b>{teacherProfile.teacher.classes?.name}</b>. 
                    Results entry will be automatically enabled after each exam date.
                  </p>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
