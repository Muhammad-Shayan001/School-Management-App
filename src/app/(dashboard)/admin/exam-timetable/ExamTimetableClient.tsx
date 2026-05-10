'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, Clock, BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Select } from '@/app/_components/ui/select';
import { getClasses, getSubjects } from '@/app/_lib/actions/timetable';
import { getExamSchedules, addExamSchedule, deleteExamSchedule } from '@/app/_lib/actions/exams';

export default function ExamTimetableClient() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [clsRes, subRes] = await Promise.all([
        getClasses(),
        getSubjects()
      ]);
      if (clsRes.data) setClasses(clsRes.data);
      if (subRes.data) setSubjects(subRes.data);
      
      if (clsRes.data && clsRes.data.length > 0) {
        setSelectedClass(clsRes.data[0].id);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadExams();
    }
  }, [selectedClass]);

  async function loadExams() {
    setIsLoading(true);
    const { data } = await getExamSchedules(selectedClass);
    if (data) setExams(data);
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!selectedClass) {
      alert('Please select a class from the top-right dropdown first.');
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const subjectId = formData.get('subject_id');
    const examDate = formData.get('exam_date');
    const title = formData.get('title');

    if (!subjectId || !examDate || !title) {
      alert('Please fill in all required fields: Title, Subject, and Date.');
      return;
    }

    setIsAdding(true);
    formData.append('class_id', selectedClass);
    
    try {
      const res = await addExamSchedule(formData);
      
      if (res?.success) {
        alert('Exam schedule entry added successfully!');
        form.reset();
        await loadExams();
      } else {
        alert('Error: ' + (res?.error || 'Failed to add exam schedule'));
      }
    } catch (err: any) {
      alert('An unexpected error occurred: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this exam schedule?')) {
      await deleteExamSchedule(id);
      await loadExams();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Exam Schedule</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage examination timetables</p>
        </div>
        
        <div className="w-full sm:w-64">
          <Select
            options={classes.map(c => ({ value: c.id, label: `${c.name} ${c.section || ''}` }))}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Add Exam Form */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Add Exam</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="col-span-1 lg:col-span-1">
            <Input
              name="title"
              type="text"
              label="Exam Title"
              placeholder="e.g. Mid Term"
              required
            />
          </div>
          <div className="col-span-1 lg:col-span-1">
            <Select
              name="subject_id"
              label="Subject"
              required
              options={subjects.map(s => ({ value: s.id, label: s.name }))}
            />
          </div>
          <div className="col-span-1 lg:col-span-1">
            <Input
              name="exam_date"
              type="date"
              label="Date"
              required
            />
          </div>
          <div className="col-span-1 lg:col-span-1">
            <Input
              name="start_time"
              type="time"
              label="Start Time"
            />
          </div>
          <div className="col-span-1 lg:col-span-1">
            <Input
              name="end_time"
              type="time"
              label="End Time"
            />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-5 mt-2">
            <Button type="submit" isLoading={isAdding} leftIcon={<Plus className="h-4 w-4" />}>
              Add Exam Schedule
            </Button>
          </div>
        </form>
      </div>

      {/* Exams Display */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-secondary">Loading schedule...</div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary font-medium">No exams scheduled for this class.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-background-secondary text-text-secondary font-medium border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-4">Exam Title</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-background-secondary/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">{exam.title}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-accent" />
                        {exam.subject?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-text-secondary">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {new Date(exam.exam_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-text-secondary">
                        <Clock className="h-4 w-4 mr-2" />
                        {exam.start_time ? exam.start_time.slice(0,5) : '-'} 
                        {exam.end_time ? ` - ${exam.end_time.slice(0,5)}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(exam.id)}
                        className="p-2 text-danger hover:bg-danger-subtle rounded-md transition-colors"
                        title="Delete exam"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
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
