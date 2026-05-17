import { getAssignmentDetails, getAssignmentSubmissions, gradeSubmission } from "@/app/_lib/actions/assignments";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Link as LinkIcon, 
  Edit3, 
  User, 
  GraduationCap, 
  Calendar,
  MessageSquare,
  Award,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cn } from "@/app/_lib/utils/cn";

export const metadata = {
  title: "Assignment Submissions | Teacher Dashboard",
};

export default async function AssignmentDetailsPage({ params }: { params: { id: string } }) {
  const assignment = await getAssignmentDetails(params.id);
  const submissions = await getAssignmentSubmissions(params.id);

  if (!assignment) {
    return (
      <div className="flex-1 p-20 text-center flex flex-col items-center justify-center">
        <div className="h-20 w-20 rounded-3xl bg-danger/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-danger" />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2">Assignment Not Found</h2>
        <p className="text-text-tertiary font-bold mb-8">This assignment may have been deleted or is unavailable.</p>
        <Link href="/teacher/assignments">
          <Button variant="outline" className="rounded-2xl px-8 h-14">Back to Assignments</Button>
        </Link>
      </div>
    );
  }

  const deadline = new Date(assignment.deadline);
  const isPastDue = deadline < new Date();

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end justify-between">
        <div className="flex items-start gap-5">
          <Link href="/teacher/assignments">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-xl shadow-black/5 border border-border/50 flex items-center justify-center hover:bg-bg-tertiary transition-all group">
                <ArrowLeft className="h-5 w-5 text-text-tertiary group-hover:text-accent transition-colors" />
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Badge variant={isPastDue ? "danger" : "success"} dot>
                    {isPastDue ? "Deadline Passed" : "Active & Accepting"}
                </Badge>
                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Submission Management</span>
            </div>
            <h1 className="text-3xl font-black text-text-primary tracking-tighter">{assignment.title}</h1>
            <div className="flex items-center gap-3 mt-1">
                <Badge variant="default">{assignment.class?.name || "No Class"}</Badge>
                <span className="text-text-tertiary opacity-40">•</span>
                <Badge variant="default" className="text-accent border-accent/20 bg-accent/5">{assignment.subject?.name || "Subject"}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="px-5 py-3 rounded-2xl bg-white border border-border/50 shadow-lg shadow-black/5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-bg-tertiary flex items-center justify-center">
                    <User className="h-5 w-5 text-accent" />
                </div>
                <div>
                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Total Submissions</p>
                    <p className="text-lg font-black text-text-primary leading-none">{submissions?.length || 0}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/70 backdrop-blur-md border border-border/30 rounded-[32px] shadow-2xl shadow-black/5 p-8 space-y-8">
            <div>
                <h3 className="font-black text-lg text-text-primary flex items-center gap-3 mb-6">
                    <FileText className="h-5 w-5 text-accent" />
                    Assignment Brief
                </h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-tertiary/50 border border-border/30">
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Max Marks</span>
                        <span className="text-sm font-black text-text-primary">{assignment.max_marks || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-tertiary/50 border border-border/30">
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Deadline</span>
                        <span className={cn("text-xs font-black", isPastDue ? "text-danger" : "text-text-primary")}>
                            {deadline.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>

            {assignment.description && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                    <AlignLeft className="h-3.5 w-3.5" /> Instructions
                </h4>
                <div className="p-5 rounded-2xl bg-white border border-border/20 text-sm text-text-secondary font-medium leading-relaxed shadow-inner">
                    {assignment.description}
                </div>
              </div>
            )}

            {assignment.attachment_url && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5" /> Resource
                </h4>
                <a 
                  href={assignment.attachment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-accent text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open Attachment
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Submissions List */}
        <div className="lg:col-span-8 space-y-6">
            <h3 className="font-black text-xl text-text-primary flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-accent" />
                Student Submissions
                <div className="px-2 py-1 bg-accent/10 rounded-lg text-accent text-xs font-black ml-2">
                    {submissions?.length || 0} Total
                </div>
            </h3>
            
            <div className="space-y-6">
              {submissions?.length === 0 ? (
                <div className="p-16 text-center bg-white/50 backdrop-blur-md border border-dashed border-border/50 rounded-[40px] flex flex-col items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-text-tertiary opacity-30" />
                  </div>
                  <p className="text-text-tertiary font-bold tracking-tight">No submissions received yet.</p>
                </div>
              ) : (
                submissions?.map((sub: any) => (
                  <div key={sub.id} className="group bg-white border border-border/30 rounded-[32px] shadow-xl shadow-black/5 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-accent/30">
                    <div className="p-8">
                        <div className="flex flex-col xl:flex-row justify-between gap-8">
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-bg-tertiary border border-border/30 overflow-hidden flex items-center justify-center">
                                        {sub.student?.avatar_url ? (
                                            <img src={sub.student.avatar_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-7 w-7 text-text-tertiary" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-text-primary tracking-tight">
                                            {sub.student?.full_name || "Unknown Student"}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-text-tertiary uppercase tracking-wider">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(sub.submitted_at).toLocaleDateString()}
                                            </div>
                                            <span className="text-text-tertiary opacity-40 text-xs">•</span>
                                            <Badge variant={
                                                sub.status === 'graded' ? 'success' :
                                                sub.status === 'late' ? 'danger' :
                                                'info'
                                            } dot>
                                                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {sub.text_answer && (
                                    <div className="p-5 rounded-2xl bg-bg-tertiary/30 border border-border/20 text-sm font-medium text-text-secondary leading-relaxed">
                                        <div className="flex items-center gap-2 mb-2 text-text-tertiary">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Student Response</span>
                                        </div>
                                        {sub.text_answer}
                                    </div>
                                )}

                                {sub.file_url && (
                                    <a 
                                        href={sub.file_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all font-black text-xs uppercase tracking-widest w-fit"
                                    >
                                        <LinkIcon className="h-4 w-4" /> 
                                        View Attached Document
                                    </a>
                                )}
                            </div>

                            {/* Grading Form */}
                            <div className="xl:w-80 p-6 bg-bg-tertiary/50 border border-border/30 rounded-3xl space-y-5">
                                <h5 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Award className="h-4 w-4 text-accent" /> Assessment & Grade
                                </h5>
                                
                                <form action={async (formData) => {
                                    "use server";
                                    const marks = Number(formData.get("marks"));
                                    const feedback = formData.get("feedback") as string;
                                    await gradeSubmission(sub.id, marks, feedback);
                                    revalidatePath(`/teacher/assignments/${params.id}`);
                                }} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest ml-1">Marks Earned</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                name="marks" 
                                                defaultValue={sub.marks !== null ? sub.marks : ""}
                                                required
                                                min="0"
                                                max={assignment.max_marks || undefined}
                                                className="w-full bg-white border border-border/40 rounded-xl py-3 px-4 text-sm font-black text-text-primary focus:outline-none focus:border-accent/40 transition-all"
                                                placeholder={`0 / ${assignment.max_marks || '∞'}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest ml-1">Teacher Feedback</label>
                                        <textarea 
                                            name="feedback" 
                                            defaultValue={sub.feedback || ""}
                                            rows={3}
                                            className="w-full bg-white border border-border/40 rounded-xl py-3 px-4 text-xs font-bold text-text-secondary focus:outline-none focus:border-accent/40 transition-all resize-none"
                                            placeholder="Write feedback for the student..."
                                        />
                                    </div>

                                    <Button type="submit" className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-accent/10">
                                        {sub.status === 'graded' ? 'Update Grade' : 'Finalize Grade'}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>
      </div>
    </div>
  );
}

const AlignLeft = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
);