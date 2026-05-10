import { getFullProfile } from "@/app/_lib/actions/profile";
import { getTeacherAssignments as getTeacherSubjectAssignments } from "@/app/_lib/actions/results";
import { createAssignment } from "@/app/_lib/actions/assignments";
import { Button } from "@/app/_components/ui/button";
import { ArrowLeft, Upload, FileText, Calendar, AlignLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/teacher/assignments">
          <Button variant="outline" className="p-2 w-10 text-center">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Create Assignment</h2>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6">
        <form action={createAssignment} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Assignment Title *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="title"
                name="title"
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pl-10"
                placeholder="e.g. Chapter 4 Practice Questions"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                <AlignLeft className="h-4 w-4 text-slate-400" />
              </div>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="flex w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pl-10"
                placeholder="Detailed instructions for the students..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="class_id" className="text-sm font-medium">Class *</label>
              <select
                id="class_id"
                name="class_id"
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a Class</option>
                {Array.from(new Set(teacherAssignments.map(ta => ta.classes?.id))).map((classId) => {
                  const cls = teacherAssignments.find(ta => ta.classes?.id === classId)?.classes;
                  if (!cls) return null;
                  return (
                    <option key={classId} value={classId}>
                      {cls.name} {cls.section ? `(${cls.section})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject_id" className="text-sm font-medium">Subject *</label>
              <select
                id="subject_id"
                name="subject_id"
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a Subject</option>
                {Array.from(new Set(teacherAssignments.map(ta => ta.subjects?.id))).map((subjectId) => {
                  const subject = teacherAssignments.find(ta => ta.subjects?.id === subjectId)?.subjects;
                  if (!subject) return null;
                  return (
                    <option key={subjectId} value={subjectId}>
                      {subject.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="deadline" className="text-sm font-medium">Due Date & Time *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="datetime-local"
                  id="deadline"
                  name="deadline"
                  required
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="max_marks" className="text-sm font-medium">Total Marks</label>
              <input
                type="number"
                id="max_marks"
                name="max_marks"
                placeholder="100"
                min="0"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="attachment_url" className="text-sm font-medium">Attachment URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Upload className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="url"
                id="attachment_url"
                name="attachment_url"
                placeholder="https://example.com/document.pdf"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pl-10"
              />
            </div>
            <p className="text-xs text-slate-500">Provide a link to a Google Drive file, DropBox file, or other resource.</p>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <Link href="/teacher/assignments">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit">Publish Assignment</Button>
          </div>
        </form>
      </div>
    </div>
  );
}