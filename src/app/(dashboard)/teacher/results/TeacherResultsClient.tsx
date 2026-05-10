'use client';

import { useState, useEffect } from 'react';
import { getTeacherAssignments, getClassStudents, saveSubjectResult, checkIfClassTeacher, getSubjectResults } from '@/app/_lib/actions/results';
import { getExamSchedules } from '@/app/_lib/actions/exams';
import { Card } from '@/app/_components/ui/card';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { BarChart3, Save, CheckCircle2, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';
import Link from 'next/link';

export default function TeacherResultsClient() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<Record<string, { obtained: string, total: string, remarks: string }>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [savedStudentIds, setSavedStudentIds] = useState<Set<string>>(new Set());
  const [isClassTeacher, setIsClassTeacher] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      const [assignRes, classTeacherRes, examsRes] = await Promise.all([
        getTeacherAssignments(),
        checkIfClassTeacher(),
        getExamSchedules()
      ]);
      
      setAssignments(assignRes.data || []);
      setIsClassTeacher(!!classTeacherRes.isClassTeacher);
      setExams(examsRes.data || []);
      setIsLoading(false);
    }
    loadInitialData();
  }, []);

  const loadStudentsForAssignment = async (classId: string, assignmentId: string, subjectId: string) => {
    if (activeAssignmentId === assignmentId) {
      setActiveAssignmentId(null);
      return;
    }
    setActiveAssignmentId(assignmentId);
    setSavedStudentIds(new Set());
    setIsFetchingStudents(true);
    
    // Find if there was an exam scheduled for this specific assignment
    const relatedExam = exams.find(e => e.class_id === classId && e.subject_id === subjectId);
    const defaultTotal = relatedExam?.total_marks?.toString() || '100';

    const [{ data: stdData }, { data: resData }] = await Promise.all([
      getClassStudents(classId),
      getSubjectResults(classId, subjectId)
    ]);

    if (stdData) {
      setStudents(stdData);
      const initialMarks: Record<string, { obtained: string, total: string, remarks: string }> = {};
      
      stdData.forEach(s => {
        initialMarks[s.user_id] = { obtained: '', total: defaultTotal, remarks: '' };
      });

      if (resData) {
        resData.forEach(r => {
          if (initialMarks[r.student_id]) {
            initialMarks[r.student_id] = {
              obtained: r.marks?.toString() || '',
              total: r.total_marks?.toString() || defaultTotal,
              remarks: ''
            };
          }
        });
      }
      setMarksData(initialMarks);
    }
    setIsFetchingStudents(false);
  };

  const handleSaveAll = async (assignment: any) => {
    setIsSaving(true);
    setMessage(null);
    let errorCount = 0;
    const savedIds = new Set<string>();

    for (const student of students) {
      const data = marksData[student.user_id];
      if (data && data.obtained !== '') {
        const formData = new FormData();
        formData.append('student_id', student.user_id);
        formData.append('class_id', assignment.class_id);
        formData.append('subject_id', assignment.subject_id);
        formData.append('marks_obtained', data.obtained);
        formData.append('total_marks', data.total);


        const res = await saveSubjectResult(formData);
        if (res.error) errorCount++;
        else savedIds.add(student.user_id);
      }
    }

    setIsSaving(false);
    if (errorCount > 0) {
      setMessage({ type: 'error', text: `Failed to save ${errorCount} records.` });
    } else {
      setMessage({ type: 'success', text: `Results for ${assignment.subjects?.name} updated successfully!` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {isClassTeacher && (
        <Card className="p-8 border-none bg-gradient-to-br from-accent to-accent-dark text-white shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-45 transition-all">
             <Sparkles className="h-40 w-40" />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Class Teacher Dashboard</p>
              <h3 className="text-2xl font-black tracking-tight mb-2">Result Compilation Hub</h3>
              <p className="text-sm opacity-80 max-w-md mb-6 leading-relaxed">
                Finalize all subject marks into official report cards once exams are completed.
              </p>
              <Link href="/teacher/results/publish">
                <Button className="bg-white text-accent hover:bg-bg-tertiary font-black px-8 h-12 rounded-xl shadow-lg">
                  Merge & Publish Final Results
                </Button>
              </Link>
           </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {assignments.map((assignment) => {
          const isExpanded = activeAssignmentId === assignment.id;
          const relatedExam = exams.find(e => e.class_id === assignment.class_id && e.subject_id === assignment.subject_id);
          
          return (
            <Card key={assignment.id} className="card-standard p-0 overflow-hidden bg-white border-border/50 shadow-md transition-all duration-300">
              <div 
                className="p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer bg-bg-secondary/10 hover:bg-bg-secondary/30 transition-colors gap-4"
                onClick={() => loadStudentsForAssignment(assignment.class_id, assignment.id, assignment.subject_id)}
              >
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "h-12 w-12 rounded-xl flex items-center justify-center font-black text-xl",
                     relatedExam ? "bg-emerald-100 text-emerald-600" : "bg-bg-tertiary text-text-tertiary"
                   )}>
                     {assignment.subjects?.name.charAt(0)}
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-text-primary tracking-tight">{assignment.subjects?.name}</h2>
                     <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                       {assignment.classes?.name} — {assignment.classes?.section}
                     </p>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                  {relatedExam && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-border shadow-sm">
                      <Calendar className="h-3.5 w-3.5 text-accent" />
                      <span className="text-[10px] font-black text-text-secondary uppercase">Exam: {new Date(relatedExam.exam_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <Button variant="ghost" className="font-black text-accent text-xs uppercase tracking-widest">
                    {isExpanded ? 'Hide Students' : 'Enter Marks'}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border/50 animate-in slide-in-from-top-4 duration-500">
                  <div className="p-4 bg-bg-tertiary/30 flex justify-between items-center px-8 border-b border-border/30">
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                       <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Live Result Entry Active</p>
                    </div>
                    <Button onClick={() => handleSaveAll(assignment)} isLoading={isSaving} className="btn-primary gap-2 text-xs h-10 px-6 shadow-md">
                      <Save className="h-4 w-4" /> Save All Marks
                    </Button>
                  </div>

                  {isFetchingStudents ? (
                    <div className="p-20 text-center"><PageSpinner /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-bg-tertiary/20 text-[10px] font-black uppercase tracking-widest text-text-tertiary border-b border-border/50">
                          <tr>
                            <th className="px-8 py-5">Roll No</th>
                            <th className="px-8 py-5">Student Name</th>
                            <th className="px-8 py-5 text-center w-32">Total Marks</th>
                            <th className="px-8 py-5 text-center w-32">Obtained</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {students.map((student) => (
                            <tr key={student.user_id} className="hover:bg-bg-tertiary/10 transition-colors group">
                              <td className="px-8 py-4 font-black text-text-tertiary text-xs">{student.roll_number || '-'}</td>
                              <td className="px-8 py-4 font-black text-text-primary">{student.profiles?.full_name}</td>
                              <td className="px-8 py-4 text-center">
                                <input 
                                  type="number"
                                  value={marksData[student.user_id]?.total || ''} 
                                  onChange={(e) => setMarksData({...marksData, [student.user_id]: {...marksData[student.user_id], total: e.target.value}})}
                                  className="w-20 px-3 py-2 bg-bg-tertiary border border-border/50 rounded-lg text-center font-bold outline-none focus:border-accent"
                                />
                              </td>
                              <td className="px-8 py-4 text-center">
                                <input 
                                  type="number"
                                  placeholder="0"
                                  value={marksData[student.user_id]?.obtained || ''} 
                                  onChange={(e) => setMarksData({...marksData, [student.user_id]: {...marksData[student.user_id], obtained: e.target.value}})}
                                  className="w-20 px-3 py-2 bg-white border-2 border-accent/20 rounded-lg text-center font-black text-accent outline-none focus:border-accent shadow-sm"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
