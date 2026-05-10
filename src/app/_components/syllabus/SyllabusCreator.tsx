'use client';

import { useState } from 'react';
import { createSyllabus } from '@/app/_lib/actions/syllabus';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Plus, Trash2, X, Save, BookOpen, GraduationCap, Calendar } from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';

interface SyllabusCreatorProps {
  classes: any[];
  subjects: any[];
  onSuccess: () => void;
  onCancel: () => void;
  isAdmin?: boolean;
}

export default function SyllabusCreator({ classes, subjects, onSuccess, onCancel, isAdmin }: SyllabusCreatorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    academic_session: '2026-2027',
    class_id: '',
    subject_id: '',
    chapters: [{ title: '', description: '', start_date: '', end_date: '', order_index: 1 }]
  });

  const handleAddChapter = () => {
    setFormData(prev => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        { title: '', description: '', start_date: '', end_date: '', order_index: prev.chapters.length + 1 }
      ]
    }));
  };

  const handleRemoveChapter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.filter((_, i) => i !== index)
    }));
  };

  const handleChapterChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newChapters = [...prev.chapters];
      newChapters[index] = { ...newChapters[index], [field]: value };
      return { ...prev, chapters: newChapters };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.subject_id) return alert('Please select a class and subject');
    
    setIsSaving(true);
    const result = await createSyllabus({
      title: formData.title,
      academic_session: formData.academic_session,
      class_id: formData.class_id,
      subject_id: formData.subject_id,
      chapters: formData.chapters
    });

    if (result.error) {
      alert(result.error);
    } else {
      onSuccess();
    }
    setIsSaving(false);
  };

  return (
    <Card className="border-none shadow-2xl bg-white p-0 overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="p-8 border-b border-border/50 bg-bg-secondary/20 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Create Academic Syllabus</h2>
          <p className="text-sm text-text-secondary font-medium">Define the course structure and timeline</p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="h-10 w-10 p-0 rounded-full hover:bg-white">
          <X className="h-5 w-5 text-text-tertiary" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary flex items-center gap-1.5">
              <GraduationCap className="h-3 w-3" /> Target Class *
            </label>
            <select 
              required
              className="w-full h-12 rounded-xl border border-border bg-bg-secondary/50 px-4 text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              value={formData.class_id}
              onChange={(e) => setFormData({...formData, class_id: e.target.value})}
            >
              <option value="">Select Class</option>
              {classes.map((c, idx) => (
                <option key={c?.id || `class-${idx}`} value={c?.id}>{c?.name} {c?.section ? `(${c.section})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" /> Subject *
            </label>
            <select 
              required
              className="w-full h-12 rounded-xl border border-border bg-bg-secondary/50 px-4 text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              value={formData.subject_id}
              onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
            >
              <option value="">Select Subject</option>
              {subjects.map((s, idx) => (
                <option key={s?.id || `subject-${idx}`} value={s?.id}>{s?.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Session *
            </label>
            <select 
              required
              className="w-full h-12 rounded-xl border border-border bg-bg-secondary/50 px-4 text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              value={formData.academic_session}
              onChange={(e) => setFormData({...formData, academic_session: e.target.value})}
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Syllabus Title *</label>
            <input 
              type="text" required
              placeholder="e.g. Final Term Syllabus"
              className="w-full h-12 rounded-xl border border-border bg-bg-secondary/50 px-4 text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-border/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
              Course Breakdown <span className="text-xs font-bold text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">{formData.chapters.length}</span>
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={handleAddChapter} className="gap-2 rounded-xl h-9 border-accent/20 text-accent hover:bg-accent/5">
              <Plus className="h-4 w-4" /> Add Topic
            </Button>
          </div>

          <div className="space-y-4">
            {formData.chapters.map((chapter, index) => (
              <div key={index} className="p-6 rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-all relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-all" />
                <button type="button" onClick={() => handleRemoveChapter(index)} className="absolute top-6 right-6 text-text-tertiary hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mr-8">
                  <div className="md:col-span-3 space-y-2">
                    <input 
                      type="text" required placeholder="Chapter / Topic Title (e.g. Algebra Fundamentals)"
                      className="w-full h-11 rounded-xl border border-border bg-bg-secondary/10 px-4 text-sm font-black focus:border-accent outline-none"
                      value={chapter.title}
                      onChange={(e) => handleChapterChange(index, 'title', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <textarea 
                      placeholder="Learning objectives, scope, and key concepts..."
                      className="w-full rounded-xl border border-border bg-bg-secondary/10 p-4 text-sm font-medium resize-none h-24 focus:border-accent outline-none"
                      value={chapter.description}
                      onChange={(e) => handleChapterChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest ml-1">Est. Start</label>
                    <input 
                      type="date"
                      className="w-full h-11 rounded-xl border border-border bg-bg-secondary/10 px-4 text-sm font-bold focus:border-accent outline-none"
                      value={chapter.start_date}
                      onChange={(e) => handleChapterChange(index, 'start_date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest ml-1">Est. Completion</label>
                    <input 
                      type="date"
                      className="w-full h-11 rounded-xl border border-border bg-bg-secondary/10 px-4 text-sm font-bold focus:border-accent outline-none"
                      value={chapter.end_date}
                      onChange={(e) => handleChapterChange(index, 'end_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t border-border/50">
          <Button variant="ghost" type="button" onClick={onCancel} className="h-12 px-8 rounded-xl font-black text-sm">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="h-12 px-12 rounded-xl font-black text-sm bg-accent shadow-xl shadow-accent/20">
            <Save className="h-4 w-4 mr-2" /> Publish Syllabus
          </Button>
        </div>
      </form>
    </Card>
  );
}
