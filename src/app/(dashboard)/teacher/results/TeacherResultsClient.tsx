'use client';

import { useState, useEffect } from 'react';
import { 
  getTeacherAssignments, 
  getTeacherSubjectsForClass, 
  getClassStudents, 
  saveSubjectResult, 
  getSubjectResults 
} from '@/app/_lib/actions/results';
import { Card } from '@/app/_components/ui/card';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  GraduationCap, 
  Search, 
  Filter,
  Calculator,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';
import Link from 'next/link';

export default function TeacherResultsClient() {
  // Data State
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [classTeacherClass, setClassTeacherClass] = useState<any>(null);

  // Selection State
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Status State
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingSubjects, setIsFetchingSubjects] = useState(false);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Marks Data
  const [marksData, setMarksData] = useState<Record<string, { obtained: string, total: string, remarks: string }>>({});

  // Initial Data Load
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      const res = await getTeacherAssignments();
      if (res.data) {
        // Extract unique classes from assignments
        const uniqueClasses = Array.from(new Set(res.data.map((a: any) => a.classes.id)))
          .map(id => res.data.find((a: any) => a.classes.id === id).classes);
        setClasses(uniqueClasses);
        setIsClassTeacher(res.isClassTeacher);
        setClassTeacherClass(res.classTeacherClass);
      }
      setIsLoading(false);
    }
    loadInitialData();
  }, []);

  // Fetch subjects when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      setSelectedSubjectId('');
      return;
    }

    async function loadSubjects() {
      setIsFetchingSubjects(true);
      const res = await getTeacherSubjectsForClass(selectedClassId);
      setSubjects(res.data || []);
      setIsFetchingSubjects(false);
      
      // If only one subject, auto-select it
      if (res.data && res.data.length === 1) {
        setSelectedSubjectId(res.data[0].id);
      }
    }
    loadSubjects();
    setStudents([]); // Clear students when class changes
  }, [selectedClassId]);

  // Fetch students when subject changes
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId) {
      setStudents([]);
      return;
    }

    async function loadStudents() {
      setIsFetchingStudents(true);
      const [{ data: stdData }, { data: resData }] = await Promise.all([
        getClassStudents(selectedClassId),
        getSubjectResults(selectedClassId, selectedSubjectId)
      ]);

      if (stdData) {
        setStudents(stdData);
        const initialMarks: Record<string, { obtained: string, total: string, remarks: string }> = {};
        
        stdData.forEach((s: any) => {
          const existingRes = resData?.find((r: any) => r.student_id === s.user_id);
          initialMarks[s.user_id] = { 
            obtained: existingRes?.marks?.toString() || '', 
            total: existingRes?.total_marks?.toString() || '100', 
            remarks: '' 
          };
        });
        setMarksData(initialMarks);
      }
      setIsFetchingStudents(false);
    }
    loadStudents();
  }, [selectedSubjectId, selectedClassId]);

  const calculateGrade = (obtained: number, total: number) => {
    if (!total || total === 0) return '-';
    const percentage = (obtained / total) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setMessage(null);
    let errorCount = 0;
    let savedCount = 0;

    for (const student of students) {
      const data = marksData[student.user_id];
      if (data && data.obtained !== '') {
        const formData = new FormData();
        formData.append('student_id', student.user_id);
        formData.append('class_id', selectedClassId);
        formData.append('subject_id', selectedSubjectId);
        formData.append('marks_obtained', data.obtained);
        formData.append('total_marks', data.total);

        const res = await saveSubjectResult(formData);
        if (res.error) errorCount++;
        else savedCount++;
      }
    }

    setIsSaving(false);
    if (errorCount > 0) {
      setMessage({ type: 'error', text: `Failed to save ${errorCount} records.` });
    } else if (savedCount > 0) {
      setMessage({ type: 'success', text: `Successfully saved ${savedCount} student records!` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredStudents = students.filter(s => 
    s.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.roll_number && s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter flex items-center gap-3">
             Results Hub
          </h1>
          <p className="text-text-secondary font-medium mt-1">Manage student marks and academic performance.</p>
        </div>

        {isClassTeacher && (
           <Link href="/teacher/results/publish">
              <Button className="bg-accent hover:bg-accent-dark text-white font-black px-6 h-12 rounded-xl shadow-lg shadow-accent/20 flex items-center gap-2 group transition-all">
                <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                Class Teacher Panel
              </Button>
           </Link>
        )}
      </div>

      {/* Filter Card */}
      <Card className="p-8 bg-white border-none shadow-2xl shadow-gray-200/50 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {/* Class Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary flex items-center gap-2">
              <GraduationCap className="h-3 w-3" /> Select Class
            </label>
            <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-14 bg-bg-tertiary/50 border-2 border-transparent focus:border-accent/30 focus:bg-white transition-all rounded-2xl px-5 font-bold text-text-primary outline-none appearance-none"
            >
              <option value="">Choose a class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.section && c.section.toUpperCase() !== 'A' ? ` - ${c.section}` : ''}</option>
              ))}
            </select>
          </div>

          {/* Subject Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary flex items-center gap-2">
              <BookOpen className="h-3 w-3" /> Select Subject
            </label>
            <div className="relative">
              <select 
                value={selectedSubjectId}
                disabled={!selectedClassId || isFetchingSubjects}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full h-14 bg-bg-tertiary/50 border-2 border-transparent focus:border-accent/30 focus:bg-white transition-all rounded-2xl px-5 font-bold text-text-primary outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{isFetchingSubjects ? 'Loading subjects...' : 'Choose a subject...'}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {isFetchingSubjects && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <div className="h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Search Field */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary flex items-center gap-2">
              <Search className="h-3 w-3" /> Search Student
            </label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Name or Roll No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 bg-bg-tertiary/50 border-2 border-transparent focus:border-accent/30 focus:bg-white transition-all rounded-2xl px-5 pl-12 font-bold text-text-primary outline-none"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {!selectedClassId || !selectedSubjectId ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
           <div className="h-20 w-20 bg-accent/10 rounded-3xl flex items-center justify-center mb-6">
              <TrendingUp className="h-10 w-10 text-accent opacity-50" />
           </div>
           <h3 className="text-xl font-black text-text-primary tracking-tight">Ready to Grade?</h3>
           <p className="text-text-tertiary font-medium max-w-xs mt-2">Select a class and subject above to start managing results.</p>
        </div>
      ) : isFetchingStudents ? (
        <div className="py-24 text-center"><PageSpinner /></div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Total Students</p>
                <p className="text-xl font-black text-text-primary">{students.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Marks Entered</p>
                <p className="text-xl font-black text-text-primary">
                  {Object.values(marksData).filter(m => m.obtained !== '').length}
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
              <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Auto-Grading</p>
                <p className="text-xl font-black text-text-primary">Active</p>
              </div>
            </div>
          </div>

          {/* Result Table */}
          <Card className="bg-white border-none shadow-2xl shadow-gray-200/50 rounded-3xl overflow-hidden">
            <div className="p-6 bg-bg-secondary/20 border-b border-gray-100 flex justify-between items-center px-8">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-accent rounded-xl flex items-center justify-center text-white">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <h3 className="font-black text-text-primary tracking-tight">Academic Performance Record</h3>
               </div>
               
               <Button 
                 onClick={handleSaveAll} 
                 isLoading={isSaving} 
                 className="bg-accent hover:bg-accent-dark text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-accent/20 flex items-center gap-2"
               >
                 <Save className="h-4 w-4" /> Save All Records
               </Button>
            </div>

            {message && (
              <div className={cn(
                "m-6 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2",
                message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
              )}>
                {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <p className="font-bold text-sm">{message.text}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg-tertiary/20 text-[10px] font-black uppercase tracking-widest text-text-tertiary border-b border-border/50">
                    <th className="px-8 py-6">Student Information</th>
                    <th className="px-8 py-6 text-center">Total Marks</th>
                    <th className="px-8 py-6 text-center">Obtained</th>
                    <th className="px-8 py-6 text-center">Grade</th>
                    <th className="px-8 py-6 text-center">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-text-tertiary font-medium">No students found matching your search.</td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const m = marksData[student.user_id];
                      const obtained = parseFloat(m?.obtained || '0');
                      const total = parseFloat(m?.total || '100');
                      const percentage = total > 0 ? (obtained / total) * 100 : 0;
                      const grade = calculateGrade(obtained, total);
                      
                      return (
                        <tr key={student.user_id} className="hover:bg-bg-tertiary/10 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center font-black text-accent text-xs">
                                  {student.profiles.full_name.charAt(0)}
                               </div>
                               <div>
                                  <p className="font-black text-text-primary leading-none">{student.profiles.full_name}</p>
                                  <p className="text-[10px] font-bold text-text-tertiary uppercase mt-1">Roll: {student.roll_number || '-'}</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <input 
                              type="number"
                              value={m?.total || ''} 
                              onChange={(e) => setMarksData({...marksData, [student.user_id]: {...marksData[student.user_id], total: e.target.value}})}
                              className="w-20 h-10 bg-bg-tertiary/50 border border-transparent focus:border-accent/20 focus:bg-white rounded-xl text-center font-bold text-sm outline-none transition-all"
                            />
                          </td>
                          <td className="px-8 py-5 text-center">
                            <input 
                              type="number"
                              placeholder="0"
                              value={m?.obtained || ''} 
                              onChange={(e) => setMarksData({...marksData, [student.user_id]: {...marksData[student.user_id], obtained: e.target.value}})}
                              className="w-20 h-12 bg-white border-2 border-accent/10 focus:border-accent rounded-xl text-center font-black text-lg text-accent outline-none transition-all shadow-sm"
                            />
                          </td>
                          <td className="px-8 py-5 text-center">
                             <div className={cn(
                               "inline-flex items-center justify-center h-10 w-10 rounded-xl font-black text-sm border-2 shadow-sm",
                               grade === 'A+' || grade === 'A' ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                               grade === 'B' || grade === 'C' ? "bg-blue-50 border-blue-200 text-blue-600" :
                               grade === 'D' ? "bg-orange-50 border-orange-200 text-orange-600" :
                               "bg-red-50 border-red-200 text-red-600"
                             )}>
                               {grade}
                             </div>
                          </td>
                          <td className="px-8 py-5 text-center min-w-[150px]">
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                               <div 
                                 className={cn(
                                   "h-full transition-all duration-1000",
                                   percentage >= 70 ? "bg-emerald-500" : percentage >= 40 ? "bg-orange-400" : "bg-red-500"
                                 )}
                                 style={{ width: `${percentage}%` }}
                               />
                            </div>
                            <span className="text-[10px] font-black text-text-tertiary mt-1 block uppercase">{percentage.toFixed(1)}% Score</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
