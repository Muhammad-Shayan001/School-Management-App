'use client';

import { useState, useEffect } from 'react';
import { getClasses, getSubjects, getTimetable, addTimetableEntry, deleteTimetableEntry } from '@/app/_lib/actions/timetable';
import { Card } from '@/app/_components/ui/card';
import { Select } from '@/app/_components/ui/select';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { Calendar, Save, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';
import Link from 'next/link';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TeacherTimetableBuilderClient({ classId, classNameStr }: { classId: string, classNameStr: string }) {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for new entry
  const [newEntry, setNewEntry] = useState({
    day_of_week: 'Monday',
    period_number: 1,
    start_time: '08:00',
    end_time: '08:45',
    subject_id: '',
    teacher_id: ''
  });
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [showCustomSubject, setShowCustomSubject] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      const [{ data: tt }, { data: subs }] = await Promise.all([
        getTimetable(classId),
        getSubjects()
      ]);
      
      if (tt) setTimetable(tt);
      if (subs) setSubjects(subs);
      
      const { getTeachers } = await import('@/app/_lib/actions/timetable');
      const { data: ts } = await getTeachers();
      if (ts) setTeachers(ts);
      
      setIsLoading(false);
    }
    loadData();
  }, [classId]);

  const handleAdd = async () => {
    if ((!newEntry.subject_id && !customSubjectName) || !newEntry.teacher_id) {
      alert('Please select both a subject and a teacher.');
      return;
    }
    
    setIsSaving(true);
    const fd = new FormData();
    fd.append('class_id', classId);
    fd.append('day_of_week', newEntry.day_of_week);
    fd.append('period_number', newEntry.period_number.toString());
    fd.append('start_time', newEntry.start_time);
    fd.append('end_time', newEntry.end_time);
    
    if (showCustomSubject) {
      fd.append('new_subject_name', customSubjectName);
    } else {
      fd.append('subject_id', newEntry.subject_id);
    }
    
    fd.append('teacher_id', newEntry.teacher_id);
    
    const res = await addTimetableEntry(fd);
    setIsSaving(false);
    
    if (res.error) {
      alert(res.error);
    } else {
      // Reload timetable and subjects
      const [{ data: tt }, { data: subs }] = await Promise.all([
        getTimetable(classId),
        getSubjects()
      ]);
      if (tt) setTimetable(tt);
      if (subs) setSubjects(subs);
      
      setCustomSubjectName('');
      setShowCustomSubject(false);

      // Auto-increment period
      setNewEntry(prev => ({
        ...prev,
        subject_id: '',
        period_number: prev.period_number < 8 ? prev.period_number + 1 : 1,
        start_time: prev.end_time,
        end_time: `${parseInt(prev.end_time.split(':')[0]) + 1}:00`
      }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this period?')) return;
    const res = await deleteTimetableEntry(id);
    if (!res.error) {
      setTimetable(prev => prev.filter(t => t.id !== id));
    }
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/timetable">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Timetable Builder</h1>
          <p className="mt-1 text-sm text-text-secondary">Building schedule for {classNameStr}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 glass-card space-y-4">
          <h2 className="font-bold text-lg border-b pb-2">Add Period</h2>
          <Select 
            label="Day" 
            value={newEntry.day_of_week} 
            onChange={(e) => setNewEntry({...newEntry, day_of_week: e.target.value})}
            options={DAYS.map(d => ({ value: d, label: d }))}
          />
          <Select 
            label="Period Number" 
            value={newEntry.period_number.toString()} 
            onChange={(e) => setNewEntry({...newEntry, period_number: parseInt(e.target.value)})}
            options={PERIODS.map(p => ({ value: p.toString(), label: `Period ${p}` }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Start Time" 
              type="time" 
              value={newEntry.start_time} 
              onChange={(e) => setNewEntry({...newEntry, start_time: e.target.value})}
            />
            <Input 
              label="End Time" 
              type="time" 
              value={newEntry.end_time} 
              onChange={(e) => setNewEntry({...newEntry, end_time: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Select 
              label="Subject" 
              value={showCustomSubject ? 'other' : newEntry.subject_id} 
              onChange={(e) => {
                if (e.target.value === 'other') {
                  setShowCustomSubject(true);
                  setNewEntry({...newEntry, subject_id: ''});
                } else {
                  setShowCustomSubject(false);
                  setNewEntry({...newEntry, subject_id: e.target.value});
                }
              }}
              options={[
                {value: '', label: 'Select Subject'}, 
                ...subjects.map(s => ({ value: s.id, label: s.name })),
                {value: 'other', label: '+ Add New Subject'}
              ]}
            />
            {showCustomSubject && (
              <Input 
                placeholder="Enter new subject name..." 
                value={customSubjectName}
                onChange={(e) => setCustomSubjectName(e.target.value)}
                autoFocus
              />
            )}
          </div>

          <Select 
            label="Teacher" 
            value={newEntry.teacher_id} 
            onChange={(e) => setNewEntry({...newEntry, teacher_id: e.target.value})}
            options={[{value: '', label: 'Select Teacher'}, ...teachers.map(t => ({ value: t.id, label: t.full_name }))]}
          />
          <Button onClick={handleAdd} isLoading={isSaving} className="w-full btn-primary gap-2 mt-4">
            <Plus className="h-4 w-4" /> Add Period
          </Button>
        </Card>

        <Card className="lg:col-span-2 p-0 glass-card overflow-hidden">
          <div className="p-4 bg-bg-secondary/50 border-b border-border-subtle">
            <h2 className="font-bold text-lg">Weekly Schedule Preview</h2>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm text-left border">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-4 py-3 border">Day</th>
                  <th className="px-4 py-3 border">Period</th>
                  <th className="px-4 py-3 border">Time</th>
                  <th className="px-4 py-3 border">Subject / Teacher</th>
                  <th className="px-4 py-3 border text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {timetable.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-tertiary">
                      No periods added yet.
                    </td>
                  </tr>
                ) : (
                  timetable.map(t => (
                    <tr key={t.id} className="hover:bg-bg-secondary/20">
                      <td className="px-4 py-3 border font-medium">{t.day_of_week}</td>
                      <td className="px-4 py-3 border text-center font-bold text-accent">{t.period_number}</td>
                      <td className="px-4 py-3 border text-text-secondary">
                        {t.start_time.slice(0,5)} - {t.end_time.slice(0,5)}
                      </td>
                      <td className="px-4 py-3 border">
                        <div className="font-bold">{t.subject?.name}</div>
                        <div className="text-xs text-text-secondary">{t.teacher?.full_name}</div>
                      </td>
                      <td className="px-4 py-3 border text-center">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-danger hover:bg-danger/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
