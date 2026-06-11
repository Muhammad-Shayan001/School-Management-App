import { getAssignmentDetails, getStudentSubmission, submitAssignment } from "@/app/_lib/actions/assignments";
import { 
  Calendar,
  Clock,
  FileText,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  ArrowLeft,
  Target,
  ExternalLink,
  MessageSquare,
  Award,
  ChevronRight,
  Send
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { cn } from "@/app/_lib/utils/cn";

export const metadata = {
  title: "Assignment Details | Student Dashboard",
};

export default async function AssignmentDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const resolvedParams = await params;
  const assignmentId = resolvedParams.id;
  
  const [assignment, submission] = await Promise.all([
    getAssignmentDetails(assignmentId),
    getStudentSubmission(assignmentId)
  ]);

  if (!assignment) {
    notFound();
  }

  const deadline = new Date(assignment.deadline);
  const isOverdue = deadline < new Date();

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end justify-between">
        <div className="flex items-start gap-5">
          <Link href="/student/assignments">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-xl shadow-black/5 border border-border/50 flex items-center justify-center hover:bg-bg-tertiary transition-all group">
                <ArrowLeft className="h-5 w-5 text-text-tertiary group-hover:text-accent transition-colors" />
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
                {submission ? (
                  <Badge variant={submission.status === 'graded' ? "success" : "info"} dot>
                    {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                  </Badge>
                ) : isOverdue ? (
                  <Badge variant="danger" dot>Overdue</Badge>
                ) : (
                  <Badge variant="warning" dot>Pending Submission</Badge>
                )}
                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Assignment Workspace</span>
            </div>
            <h1 className="text-3xl font-black text-text-primary tracking-tighter">{assignment.title}</h1>
            <div className="flex items-center gap-3 mt-1">
                <Badge variant="default" className="text-accent border-accent/20 bg-accent/5">{assignment.subject?.name || "Subject"}</Badge>
                <span className="text-text-tertiary opacity-40">•</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                    <User className="h-3.5 w-3.5" />
                    {assignment.teacher?.full_name || "Instructor"}
                </div>
            </div>
          </div>
        </div>

        {submission?.status === 'graded' && (
            <div className="px-6 py-4 rounded-[32px] bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <Award className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Grade Received</p>
                    <p className="text-2xl font-black">{submission.marks} <span className="text-sm opacity-60">/ {assignment.max_marks}</span></p>
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Assignment Brief */}
        <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/70 backdrop-blur-md border border-border/30 rounded-[32px] shadow-2xl shadow-black/5 p-8 space-y-8">
                <div>
                    <h3 className="font-black text-lg text-text-primary flex items-center gap-3 mb-6">
                        <FileText className="h-5 w-5 text-accent" />
                        Assignment Details
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl bg-bg-tertiary/50 border border-border/30">
                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Max Points</p>
                            <p className="text-xl font-black text-text-primary">{assignment.max_marks || "N/A"}</p>
                        </div>
                        <div className="p-5 rounded-3xl bg-bg-tertiary/50 border border-border/30">
                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Status</p>
                            <p className={cn("text-sm font-black uppercase tracking-widest", isOverdue && !submission ? "text-danger" : "text-emerald-600")}>
                                {submission ? "Completed" : isOverdue ? "Missed" : "Active"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 p-5 rounded-3xl bg-bg-tertiary/50 border border-border/30 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-0.5">Deadline</p>
                            <p className={cn("text-sm font-black", isOverdue && !submission ? "text-danger" : "text-text-primary")}>
                                {deadline.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <Clock className={cn("h-6 w-6 opacity-20", isOverdue && !submission ? "text-danger" : "text-text-primary")} />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Instructor Instructions
                    </h4>
                    <div className="p-6 rounded-3xl bg-white border border-border/20 text-sm font-medium text-black leading-relaxed shadow-inner">
                        {assignment.description || "No specific instructions provided by the teacher."}
                    </div>
                </div>

                {assignment.attachment_url && (
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                            <Paperclip className="h-4 w-4" /> Resource Files
                        </h4>
                        <a 
                            href={assignment.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-5 rounded-3xl bg-accent text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <ExternalLink className="h-5 w-5" />
                                Download Material
                            </div>
                            <ChevronRight className="h-5 w-5 opacity-40" />
                        </a>
                    </div>
                )}
            </div>
        </div>

        {/* Submission Workspace */}
        <div className="lg:col-span-7">
            {submission ? (
                <div className="space-y-6">
                    <h3 className="font-black text-xl text-text-primary flex items-center gap-3 ml-2">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        Your Submission
                    </h3>
                    
                    <div className="bg-white border border-border/30 rounded-[40px] shadow-2xl shadow-black/5 overflow-hidden">
                        <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Date Submitted</p>
                                        <p className="text-sm font-black text-text-primary">{new Date(submission.submitted_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <Badge variant="success" className="h-8 px-4 rounded-full uppercase text-[9px] font-black tracking-widest">Verified</Badge>
                            </div>

                            {submission.text_answer && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Your Written Response</p>
                                    <div className="p-6 rounded-[32px] bg-bg-tertiary/30 border border-border/20 text-sm font-medium text-black leading-relaxed">
                                        {submission.text_answer}
                                    </div>
                                </div>
                            )}

                            {submission.file_url && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Attached Work</p>
                                    <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 rounded-[24px] border border-border/30 hover:bg-bg-tertiary transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-bg-tertiary flex items-center justify-center">
                                                <Paperclip className="h-5 w-5 text-accent" />
                                            </div>
                                            <p className="text-xs font-black text-text-primary uppercase tracking-widest">View Submitted File</p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-text-tertiary" />
                                    </a>
                                </div>
                            )}

                            {submission.feedback && (
                                <div className="p-8 rounded-[32px] bg-accent/5 border border-accent/20 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-white shadow-md flex items-center justify-center border border-accent/20">
                                            <Award className="h-5 w-5 text-accent" />
                                        </div>
                                        <h4 className="font-black text-lg text-text-primary tracking-tight">Instructor Feedback</h4>
                                    </div>
                                    <p className="text-sm font-medium text-text-secondary leading-relaxed italic">
                                        "{submission.feedback}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <h3 className="font-black text-xl text-text-primary flex items-center gap-3 ml-2">
                        <Target className="h-6 w-6 text-accent" />
                        Submission Workspace
                    </h3>

                    <div className="bg-white border border-border/30 rounded-[40px] shadow-2xl shadow-black/5 overflow-hidden">
                        <form action={submitAssignment} className="p-8 space-y-8">
                            <input type="hidden" name="assignment_id" value={assignmentId} />
                            
                            <div className="space-y-3">
                                <label htmlFor="text_answer" className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Your Written Response</label>
                                <textarea
                                    id="text_answer"
                                    name="text_answer"
                                    rows={8}
                                    className="w-full bg-bg-tertiary/40 border border-border/40 rounded-[32px] p-6 text-sm font-bold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:bg-white transition-all shadow-sm resize-none"
                                    placeholder="Type your response or paste your essay here..."
                                ></textarea>
                            </div>

                            <div className="space-y-3">
                                <label htmlFor="file_url" className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Work Link (Drive/Cloud/URL)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-accent transition-colors">
                                        <Paperclip className="h-5 w-5" />
                                    </div>
                                    <input
                                        id="file_url"
                                        name="file_url"
                                        type="url"
                                        className="w-full bg-bg-tertiary/40 border border-border/40 rounded-[20px] py-4 pl-14 pr-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all shadow-sm"
                                        placeholder="https://docs.google.com/..."
                                    />
                                </div>
                                <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest ml-1 opacity-60">Supported: Google Drive, Dropbox, or any public link.</p>
                            </div>

                            <Button type="submit" className="w-full h-16 rounded-[24px] shadow-xl shadow-accent/20 font-black uppercase text-xs tracking-[0.2em]" disabled={isOverdue && false}>
                                <Send className="h-5 w-5 mr-3" />
                                Turn In Assignment
                            </Button>
                        </form>
                    </div>

                    {isOverdue && (
                        <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-[24px] flex items-center gap-4 text-rose-600">
                            <AlertCircle className="h-6 w-6" />
                            <p className="text-xs font-black uppercase tracking-widest leading-relaxed">
                                Warning: The deadline has passed. Your submission will be marked as "LATE".
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
