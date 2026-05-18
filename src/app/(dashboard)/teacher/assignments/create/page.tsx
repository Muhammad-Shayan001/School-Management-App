import { getFullProfile } from "@/app/_lib/actions/profile";
import { getTeacherAssignments as getTeacherSubjectAssignments } from "@/app/_lib/actions/results";
import { getClasses, getSubjects } from "@/app/_lib/actions/timetable";
import { createAssignment } from "@/app/_lib/actions/assignments";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { ArrowLeft, Upload, FileText, Calendar, AlignLeft, Target, GraduationCap, BookOpen } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Create Assignment | Teacher Dashboard",
};

export default async function CreateAssignmentPage() {
  const profileResponse = await getFullProfile();
  if (profileResponse.error || !profileResponse.data) {
    return <div>Error loading profile.</div>;
  }

  const assignmentsResponse = await getTeacherSubjectAssignments();
  const teacherAssignments = assignmentsResponse.data || [];

  const [classesRes, subjectsRes] = await Promise.all([
    getClasses(),
    getSubjects()
  ]);
  const allClasses = classesRes.data || [];
  const allSubjects = subjectsRes.data || [];

  let availableClasses: any[] = [];
  if (teacherAssignments.length > 0) {
    const classMap = new Map();
    teacherAssignments.forEach(ta => {
      if (ta.classes && ta.classes.id) classMap.set(ta.classes.id, ta.classes);
    });
    availableClasses = Array.from(classMap.values());
  } else {
    availableClasses = allClasses;
  }

  let availableSubjects: any[] = [];
  if (teacherAssignments.length > 0) {
    const subjectMap = new Map();
    teacherAssignments.forEach(ta => {
      if (ta.subjects && ta.subjects.id) subjectMap.set(ta.subjects.id, ta.subjects);
    });
    availableSubjects = Array.from(subjectMap.values());
  } else {
    availableSubjects = allSubjects;
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
            <Link href="/teacher/assignments">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-xl shadow-black/5 border border-border/50 flex items-center justify-center hover:bg-bg-tertiary transition-all group">
                <ArrowLeft className="h-5 w-5 text-text-tertiary group-hover:text-accent transition-colors" />
            </div>
            </Link>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant="accent" dot>New Module</Badge>
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Academic Portal</span>
                </div>
                <h1 className="text-3xl font-black text-text-primary tracking-tighter">Create Assignment</h1>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-md border border-border/30 rounded-[32px] shadow-2xl shadow-black/5 overflow-hidden">
                <div className="p-8 border-b border-border/30 bg-gradient-to-r from-bg-tertiary/30 to-transparent">
                    <h3 className="font-black text-lg text-text-primary flex items-center gap-3">
                        <FileText className="h-5 w-5 text-accent" />
                        Assignment Details
                    </h3>
                </div>

                <form action={createAssignment} className="p-8 space-y-8">
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
                            <Button type="button" variant="ghost" className="rounded-2xl px-8 h-14 font-black uppercase text-xs tracking-widest">Cancel</Button>
                        </Link>
                        <Button type="submit" className="rounded-2xl px-12 h-14 shadow-xl shadow-accent/20 font-black uppercase text-xs tracking-widest">
                            Publish Assignment
                        </Button>
                    </div>
                </form>
            </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
            <div className="p-8 bg-accent/5 border border-accent/20 rounded-[32px] space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-white shadow-xl shadow-accent/10 flex items-center justify-center border border-accent/20">
                    <Calendar className="h-7 w-7 text-accent" />
                </div>
                <h4 className="font-black text-lg text-text-primary tracking-tight">Assignment Scheduling</h4>
                <p className="text-sm text-text-secondary font-medium leading-relaxed">
                    Once published, this assignment will be visible to all students in the selected class instantly. 
                    Students can submit their work until the deadline.
                </p>
            </div>

            <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] space-y-4 text-emerald-800">
                <div className="h-14 w-14 rounded-2xl bg-white shadow-xl shadow-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Target className="h-7 w-7 text-emerald-600" />
                </div>
                <h4 className="font-black text-lg tracking-tight">Grading Guidelines</h4>
                <p className="text-sm font-medium leading-relaxed opacity-80">
                    Assignments marked with "Total Marks" will allow you to provide numeric scores and feedback to each student submission.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}