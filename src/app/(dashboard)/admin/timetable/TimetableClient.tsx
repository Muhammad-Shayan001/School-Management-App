'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Clock, BookOpen, User } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Select } from '@/app/_components/ui/select';
import { getClasses, getSubjects, getTeachers, getTimetable, addTimetableEntry, deleteTimetableEntry } from '@/app/_lib/actions/timetable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableClient() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { getTimetableForTeacher } = await import('@/app/_lib/actions/timetable');
      const [clsRes, subRes, tchrRes] = await Promise.all([
        getClasses(),
        getSubjects(),
        getTeachers()
      ]);
      if (clsRes.data) setClasses(clsRes.data);
      if (subRes.data) setSubjects(subRes.data);
      if (tchrRes.data) setTeachers(tchrRes.data);
      
      if (clsRes.data && clsRes.data.length > 0) {
        setSelectedClass(clsRes.data[0].id);
      }
      if (tchrRes.data && tchrRes.data.length > 0) {
        setSelectedTeacher(tchrRes.data[0].id);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [selectedClass, selectedTeacher, viewMode]);

  async function loadTimetable() {
    setIsLoading(true);
    if (viewMode === 'class' && selectedClass) {
      const { data } = await getTimetable(selectedClass);
      if (data) setTimetable(data);
    } else if (viewMode === 'teacher' && selectedTeacher) {
      const { getTimetableForTeacher } = await import('@/app/_lib/actions/timetable');
      const { data } = await getTimetableForTeacher(selectedTeacher);
      if (data) setTimetable(data);
    }
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsAdding(true);
    const formData = new FormData(e.currentTarget);
    formData.append('class_id', selectedClass);
    
    await addTimetableEntry(formData);
    await loadTimetable();
    
    setIsAdding(false);
    (e.target as HTMLFormElement).reset();
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this entry?')) {
      await deleteTimetableEntry(id);
      await loadTimetable();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Timetable Management</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage and view schedules across the institution</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'class' ? 'primary' : 'outline'} 
            onClick={() => setViewMode('class')}
            className="text-sm px-4"
          >
            By Class
          </Button>
          <Button 
            variant={viewMode === 'teacher' ? 'primary' : 'outline'} 
            onClick={() => setViewMode('teacher')}
            className="text-sm px-4"
          >
            By Teacher
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-full sm:w-64">
          {viewMode === 'class' ? (
            <Select
              options={classes.map(c => ({ value: c.id, label: `${c.name} ${c.section || ''}` }))}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={isLoading}
            />
          ) : (
            <Select
              options={teachers.map(t => ({ value: t.id, label: t.full_name }))}
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              disabled={isLoading}
            />
          )}
        </div>
      </div>

      {/* Add Entry Form - Only show when in Class view */}
      {viewMode === 'class' && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Add Timetable Entry for Class</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="col-span-1 lg:col-span-1">
              <Select
                name="day_of_week"
                label="Day"
                required
                options={DAYS.map(d => ({ value: d, label: d }))}
              />
            </div>
            <div className="col-span-1 lg:col-span-1">
              <Input
                name="period_number"
                type="number"
                label="Period"
                min={1}
                required
              />
            </div>
            <div className="col-span-1 lg:col-span-1">
              <Input
                name="start_time"
                type="time"
                label="Start Time"
                required
              />
            </div>
            <div className="col-span-1 lg:col-span-1">
              <Input
                name="end_time"
                type="time"
                label="End Time"
                required
              />
            </div>
            <div className="col-span-1 lg:col-span-1">
              <Select
                name="subject_id"
                label="Subject"
                options={subjects.map(s => ({ value: s.id, label: s.name }))}
              />
            </div>
            <div className="col-span-1 lg:col-span-1">
              <Select
                name="teacher_id"
                label="Teacher"
                options={teachers.map(t => ({ value: t.id, label: t.full_name }))}
              />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-6 mt-2">
              <Button type="submit" isLoading={isAdding} className="btn-primary gap-2">
                <Plus className="h-4 w-4" /> Add Entry
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Timetable Display */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-secondary">Loading timetable...</div>
        ) : timetable.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary font-medium">No entries found for this {viewMode}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-bg-tertiary text-text-secondary font-medium border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-4">Day</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">{viewMode === 'class' ? 'Teacher' : 'Class'}</th>
                  {viewMode === 'class' && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {timetable.map((entry) => (
                  <tr key={entry.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-primary">{entry.day_of_week}</td>
                    <td className="px-6 py-4 font-bold text-accent">{entry.period_number}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-text-secondary font-medium">
                        <Clock className="h-4 w-4 mr-2" />
                        {entry.start_time.slice(0,5)} - {entry.end_time.slice(0,5)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center font-bold">
                        <BookOpen className="h-4 w-4 mr-2 text-accent" />
                        {entry.subject?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center font-medium text-text-secondary">
                        <User className="h-4 w-4 mr-2 text-text-tertiary" />
                        {viewMode === 'class' 
                          ? entry.teacher?.full_name || '-' 
                          : `${entry.class?.name || ''} ${entry.class?.section || ''}`}
                      </div>
                    </td>
                    {viewMode === 'class' && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 text-danger hover:bg-danger/10 rounded-md transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
