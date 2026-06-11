import { getStudentAssignments } from "@/app/_lib/actions/assignments";
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Target,
  BookOpen,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/app/_components/ui/badge";
import { cn } from "@/app/_lib/utils/cn";

export const metadata = {
  title: "Assignments | Student Dashboard",
};

export default async function StudentAssignmentsPage() {
  const assignments = await getStudentAssignments();

  const getStatusConfig = (submission: any, deadline: string) => {
    if (submission) {
      if (submission.status === 'graded') {
        return { 
            label: 'Graded', 
            variant: 'success' as const, 
            icon: <CheckCircle2 className="w-3.5 h-3.5"/>,
            bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        };
      }
      return { 
          label: 'Submitted', 
          variant: 'info' as const, 
          icon: <CheckCircle2 className="w-3.5 h-3.5"/>,
          bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      };
    }
    
    if (deadline && new Date() > new Date(deadline)) {
      return { 
          label: 'Overdue', 
          variant: 'danger' as const, 
          icon: <AlertCircle className="w-3.5 h-3.5"/>,
          bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
      };
    }

    return { 
        label: 'Pending', 
        variant: 'warning' as const, 
        icon: <Clock className="w-3.5 h-3.5"/>,
        bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="accent" dot>Academic Management</Badge>
             <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">My Learning Portal</span>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter">Assignments</h1>
          <p className="text-text-secondary font-medium font-bold">Track your coursework, submit tasks, and view your grades</p>
        </div>

        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-border/30">
            <div className="px-4 py-2 text-center">
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Total Tasks</p>
                <p className="text-xl font-black text-text-primary">{assignments?.length || 0}</p>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="px-4 py-2 text-center text-emerald-600">
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Completed</p>
                <p className="text-xl font-black">{assignments?.filter((a: any) => a.submissions?.[0])?.length || 0}</p>
            </div>
        </div>
      </div>

      {!assignments || assignments.length === 0 ? (
        <div className="py-24 text-center bg-white/50 backdrop-blur-md border border-dashed border-border/50 rounded-[40px] flex flex-col items-center justify-center">
            <div className="bg-accent/10 p-6 rounded-3xl mb-6 shadow-inner ring-1 ring-accent/20">
              <ClipboardList className="h-12 w-12 text-accent" />
            </div>
            <h3 className="text-2xl font-black text-text-primary tracking-tight mb-2">Clean Slate!</h3>
            <p className="text-text-tertiary font-bold max-w-xs mx-auto">
              You don&apos;t have any active assignments at the moment. Check back later!
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {assignments.map((assignment: any) => {
            const submission = assignment.submissions?.[0];
            const status = getStatusConfig(submission, assignment.deadline);
            const deadline = new Date(assignment.deadline);
            
            return (
              <Link 
                key={assignment.id} 
                href={`/student/assignments/${assignment.id}`}
                className="group relative flex flex-col justify-between p-8 bg-white/80 backdrop-blur-sm border border-border/30 rounded-[32px] shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 overflow-hidden"
              >
                <div className={cn("absolute top-0 left-0 w-2 h-full transition-opacity duration-500", 
                    submission ? "bg-emerald-500 opacity-20 group-hover:opacity-100" : "bg-accent opacity-10 group-hover:opacity-100"
                )} />
                
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 rounded-xl bg-bg-tertiary flex items-center justify-center border border-border/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <BookOpen className="h-5 w-5 text-accent" />
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5", status.bg)}>
                        {status.icon}
                        {status.label}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-1">{assignment.subject?.name || "Academic"}</p>
                    <h3 className="font-black text-xl text-black line-clamp-2 group-hover:text-accent transition-colors tracking-tight leading-tight mb-4">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-black font-medium line-clamp-2 opacity-80 leading-relaxed">
                        {assignment.description || "No specific instructions provided. View details for more information."}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[11px] font-black text-text-secondary uppercase tracking-widest">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center border border-border/30",
                        status.label === 'Overdue' ? "bg-rose-50 text-rose-500" : "bg-bg-tertiary text-accent"
                      )}>
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className={status.label === 'Overdue' ? "text-rose-600" : ""}>
                        Due: {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-border/50">
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary group-hover:text-accent transition-colors">
                       {submission ? "Review My Work" : "Start Assignment"}
                     </span>
                   </div>
                   <div className="h-8 w-8 rounded-full bg-bg-tertiary flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-300">
                     <ArrowRight className="h-4 w-4" />
                   </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
