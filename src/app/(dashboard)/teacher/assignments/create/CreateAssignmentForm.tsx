'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from "@/app/_components/ui/button";
import { Upload, AlignLeft, Target, GraduationCap, BookOpen, Calendar } from "lucide-react";
import Link from "next/link";
import { createAssignment } from "@/app/_lib/actions/assignments";

export default function CreateAssignmentForm({ 
  availableClasses, 
  availableSubjects 
}: { 
  availableClasses: any[];
  availableSubjects: any[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    const result = await createAssignment(formData);
    
    if (result && result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
    } else {
      toast.success('Assignment created successfully!');
      // Note: The server action handles redirect for success, but in case it doesn't:
      // router.push('/teacher/assignments'); 
    }
  }

  return (
    <form action={handleSubmit} className="p-8 space-y-8">
        {/* Title */}
        <div className="space-y-3">
            <label htmlFor="title" className="text-xs font-black text-text-tertiary uppercase tracking-widest ml-1">Assignment Title *</label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-accent transition-colors">
                    <Target className="h-5 w-5" />
                </div>
                <input
                    id="title"
                    name="title"
                    required
                    className="w-full bg-bg-tertiary/40 border border-border/40 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:bg-white transition-all shadow-sm"
                    placeholder="e.g. Modern Physics Lab Report"
                />
            </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
            <label htmlFor="description" className="text-xs font-black text-text-tertiary uppercase tracking-widest ml-1">Instructions</label>
            <div className="relative group">
                <div className="absolute top-4 left-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-accent transition-colors">
                    <AlignLeft className="h-5 w-5" />
                </div>
                <textarea
                    id="description"
                    name="description"
                    rows={6}
                    className="w-full bg-bg-tertiary/40 border border-border/40 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:bg-white transition-all shadow-sm resize-none"
                    placeholder="Detail exactly what students need to do..."
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Class */}
            <div className="space-y-3">
                <label htmlFor="class_id" className="text-xs font-black text-text-tertiary uppercase tracking-widest ml-1">Target Class *</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-accent transition-colors">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <select
                        id="class_id"
                        name="class_id"
                        required
                        className="w-full bg-bg-tertiary/40 border border-border/40 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                    >
                        <option value="">Select Class</option>
                        {availableClasses.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name}{cls.section && cls.section.toUpperCase() !== 'A' ? ` - ${cls.section}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Subject */}
            <div className="space-y-3">
                <label htmlFor="subject_id" className="text-xs font-black text-text-tertiary uppercase tracking-widest ml-1">Subject *</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-accent transition-colors">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <select
                        id="subject_id"
                        name="subject_id"
                        required
                        className="w-full bg-bg-tertiary/40 border border-border/40 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                    >
                        <option value="">Select Subject</option>
                        {availableSubjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                                {sub.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Deadline */}
            <div className="space-y-3">
                <label htmlFor="deadline" className="text-xs font-black text-text-tertiary uppercase tracking-widest ml-1">Deadline *</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-accent transition-colors">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <input
                        type="datetime-local"
                        id="deadline"
                        name="deadline"
                        required
                        className="w-full bg-bg-tertiary/40 border border-border/40 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Marks */}
            <div className="space-y-3">
                <label htmlFor="max_marks" className="text-xs font-black text-text-tertiary uppercase tracking-widest ml-1">Total Marks</label>
                <input
                    type="number"
                    id="max_marks"
                    name="max_marks"
                    placeholder="100"
                    min="0"
                    className="w-full bg-bg-tertiary/40 border border-border/40 rounded-2xl py-4 px-6 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all shadow-sm"
                />
            </div>
        </div>

        {/* Attachment */}
        <div className="space-y-3">
            <label htmlFor="attachment_url" className="text-xs font-black text-text-tertiary uppercase tracking-widest ml-1">Attachment (Link)</label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-accent transition-colors">
                    <Upload className="h-5 w-5" />
                </div>
                <input
                    type="url"
                    id="attachment_url"
                    name="attachment_url"
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-bg-tertiary/40 border border-border/40 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all shadow-sm"
                />
            </div>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-1 italic">Students will be able to download/view this link.</p>
        </div>

        <div className="pt-8 border-t border-border/30 flex justify-end gap-4">
            <Link href="/teacher/assignments">
                <Button type="button" variant="ghost" disabled={isSubmitting} className="rounded-2xl px-8 h-14 font-black uppercase text-xs tracking-widest">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting} className="rounded-2xl px-12 h-14 shadow-xl shadow-accent/20 font-black uppercase text-xs tracking-widest">
                Publish Assignment
            </Button>
        </div>
    </form>
  );
}
