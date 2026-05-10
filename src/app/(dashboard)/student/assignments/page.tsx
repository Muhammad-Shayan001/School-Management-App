import { getStudentAssignments } from "@/app/_lib/actions/assignments";
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardBody,
  CardHeader,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";

export default async function StudentAssignmentsPage() {
  const assignments = await getStudentAssignments();

  const getStatusBadge = (submission: any, deadline: string) => {
    if (submission) {
      if (submission.status === 'graded') {
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Graded</Badge>;
      }
      return <Badge variant="info" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Submitted</Badge>;
    }
    
    if (deadline && new Date() > new Date(deadline)) {
      return <Badge variant="danger" className="flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Overdue</Badge>;
    }

    return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-slate-500 mt-2">
          View and submit your class assignments
        </p>
      </div>

      {!assignments || assignments.length === 0 ? (
        <Card className="border-dashed bg-slate-50/50">
          <CardBody className="flex flex-col items-center justify-center h-64 text-center">
            <div className="rounded-full bg-slate-100 p-3 mb-4">
              <ClipboardList className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">No Assignments</h3>
            <p className="text-slate-500 max-w-sm mt-2">
              You don&apos;t have any assignments right now.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((assignment: any) => {
            const submission = assignment.submissions?.[0];
            
            return (
              <Card key={assignment.id} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="default" className="bg-white">
                      {assignment.subject?.name || "Subject"}
                    </Badge>
                    {getStatusBadge(submission, assignment.deadline)}
                  </div>
                  <h3 className="text-lg font-bold line-clamp-1">{assignment.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4" />
                    Due {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(assignment.deadline))}
                  </div>
                </CardHeader>
                <CardBody className="pt-4 flex-1">
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {assignment.description || "No description provided."}
                  </p>
                </CardBody>
                <div className="pt-4 border-t">
                  <Link href={`/student/assignments/${assignment.id}`} className="w-full">
                    <Button variant={submission ? "outline" : "primary"} className="w-full">
                      {submission ? "View Submission" : "View Details"}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
