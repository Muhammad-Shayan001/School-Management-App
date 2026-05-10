import { getAssignmentDetails, getAssignmentSubmissions, gradeSubmission } from "@/app/_lib/actions/assignments";
import { Button } from "@/app/_components/ui/button";
import { ArrowLeft, Clock, FileText, CheckCircle, AlertCircle, Link as LinkIcon, Edit, User } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const metadata = {
  title: "Assignment Details | Teacher Dashboard",
};

export default async function AssignmentDetailsPage({ params }: { params: { id: string } }) {
  const assignment = await getAssignmentDetails(params.id);
  const submissions = await getAssignmentSubmissions(params.id);

  if (!assignment) {
    return (
      <div className="flex-1 p-8 text-center">
        <h2 className="text-2xl font-bold">Assignment not found</h2>
        <Link href="/teacher/assignments">
          <Button className="mt-4">Back to Assignments</Button>
        </Link>
      </div>
    );
  }

  const deadline = new Date(assignment.deadline);
  const isPastDue = deadline < new Date();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/teacher/assignments">
            <Button variant="outline" className="p-2 w-10 text-center">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{assignment.title}</h2>
            <div className="flex gap-2 text-sm text-slate-500 mt-1">
              <span>{assignment.class?.name || "Class"}</span> • 
              <span>{assignment.subject?.name || "Subject"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Status</span>
                {isPastDue ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                    <AlertCircle className="h-3 w-3" /> Closed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    <CheckCircle className="h-3 w-3" /> Active
                  </span>
                )}
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Due</span>
                <span className={isPastDue ? "text-red-600 font-medium" : ""}>
                   {deadline.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Total Marks</span>
                <span className="font-semibold">{assignment.max_marks || "N/A"}</span>
              </div>
            </div>

            {assignment.description && (
              <div className="pt-2">
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Instructions</h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{assignment.description}</p>
              </div>
            )}

            {assignment.attachment_url && (
              <div className="pt-2">
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Attachments</h4>
                <a 
                  href={assignment.attachment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <LinkIcon className="h-4 w-4" />
                  Attachment Link
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Submissions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Student Submissions
                <span className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-full ml-2">
                  {submissions?.length || 0}
                </span>
              </h3>
            </div>
            
            <div className="divide-y">
              {submissions?.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No submissions yet.
                </div>
              ) : (
                submissions?.map((sub: any) => (
                  <div key={sub.id} className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {sub.student?.full_name || sub.student?.student_id || "Unknown Student"}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span>Submitted: {new Date(sub.submitted_at).toLocaleString()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            sub.status === 'graded' ? 'bg-green-100 text-green-700' :
                            sub.status === 'late' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </span>
                        </div>

                        {sub.text_answer && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border">
                            {sub.text_answer}
                          </div>
                        )}
                        {sub.file_url && (
                          <div className="mt-3">
                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                              <LinkIcon className="h-4 w-4" /> View attached file
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Grading Form */}
                      <form action={async (formData) => {
                        "use server";
                        const marks = Number(formData.get("marks"));
                        const feedback = formData.get("feedback") as string;
                        await gradeSubmission(sub.id, marks, feedback);
                        revalidatePath(`/teacher/assignments/${params.id}`);
                      }} className="w-full sm:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                          <Edit className="h-3 w-3" /> Grade Submission
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-slate-700 mb-1 block">Marks (Max: {assignment.max_marks || "∞"})</label>
                            <input 
                              type="number" 
                              name="marks" 
                              defaultValue={sub.marks !== null ? sub.marks : ""}
                              required
                              min="0"
                              max={assignment.max_marks || undefined}
                              className="w-full h-8 px-2 py-1 text-sm border rounded-md focus:ring-2 focus:ring-primary outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-700 mb-1 block">Feedback</label>
                            <textarea 
                              name="feedback" 
                              defaultValue={sub.feedback || ""}
                              rows={2}
                              className="w-full px-2 py-1 text-sm border rounded-md focus:ring-2 focus:ring-primary outline-none"
                            />
                          </div>
                          <Button type="submit" size="sm" className="w-full">
                            {sub.status === 'graded' ? 'Update Grade' : 'Save Grade'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}