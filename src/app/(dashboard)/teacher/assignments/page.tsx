import { getTeacherAssignments } from "@/app/_lib/actions/assignments";
import Link from "next/link";
import { Plus, BookOpen, Clock, Users, ChevronRight } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { cn } from "@/app/_lib/utils/cn";

export const metadata = {
  title: "My Assignments | Teacher Dashboard",
};

export default async function TeacherAssignmentsPage() {
  const assignments = await getTeacherAssignments();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="accent" dot>Academic Management</Badge>
             <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Assignments Portal</span>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter">My Assignments</h1>
          <p className="text-text-secondary font-medium font-bold">Create and manage classroom assignments and track student submissions</p>
        </div>

        <Link href="/teacher/assignments/create">
          <Button size="lg" className="rounded-2xl shadow-xl shadow-accent/20" leftIcon={<Plus className="h-5 w-5" />}>
            Create Assignment
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assignments?.length === 0 ? (
          <div className="col-span-full py-24 text-center glass-card bg-bg-secondary/30 flex flex-col items-center justify-center">
            <div className="bg-accent/10 p-6 rounded-3xl mb-6 shadow-inner ring-1 ring-accent/20">
              <BookOpen className="h-12 w-12 text-accent" />
            </div>
            <h3 className="text-2xl font-black text-text-primary tracking-tight mb-2">No Assignments Yet</h3>
            <p className="text-text-tertiary font-bold mb-8 max-w-xs mx-auto">
              You haven't created any assignments for your classes. Start by creating your first one.
            </p>
            <Link href="/teacher/assignments/create">
              <Button variant="outline" className="rounded-2xl px-8 py-6 text-base" leftIcon={<Plus className="h-5 w-5" />}>
                Create Your First Assignment
              </Button>
            </Link>
          </div>
        ) : (
          assignments?.map((assignment: any) => {
            const deadline = new Date(assignment.deadline);
            const isPastDue = deadline < new Date();
            
            return (
              <Link 
                key={assignment.id} 
                href={`/teacher/assignments/${assignment.id}`}
                className="group relative flex flex-col justify-between p-8 bg-white border border-border/50 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-accent opacity-10 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <Badge variant="info" dot>{assignment.subject?.name || "Subject"}</Badge>
                    <Badge variant={isPastDue ? "danger" : "success"} dot>
                      {isPastDue ? "Closed" : "Active"}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-black text-xl text-text-primary line-clamp-1 group-hover:text-accent transition-colors tracking-tight leading-tight">
                      {assignment.title}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-black text-text-secondary uppercase tracking-widest">
                      <div className="h-8 w-8 rounded-lg bg-bg-tertiary flex items-center justify-center border border-border/30">
                        <Users className="h-4 w-4 text-accent" />
                      </div>
                      <span>{assignment.class?.name || "Class"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-black text-text-secondary uppercase tracking-widest">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center border border-border/30",
                        isPastDue ? "bg-red-50 text-red-500" : "bg-bg-tertiary text-accent"
                      )}>
                        <Clock className="h-4 w-4" />
                      </div>
                      <span className={isPastDue ? "text-red-500" : ""}>
                        Due: {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-border/50">
                   <span className="text-xs font-black uppercase tracking-widest text-text-tertiary group-hover:text-accent transition-colors">View Submissions</span>
                   <div className="h-8 w-8 rounded-full bg-bg-tertiary flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-300">
                     <ChevronRight className="h-4 w-4" />
                   </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
}
