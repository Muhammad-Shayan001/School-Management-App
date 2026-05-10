import { getAssignmentDetails, getStudentSubmission, submitAssignment } from "@/app/_lib/actions/assignments";
import { formatDate } from "@/app/_lib/utils/format";
import { 
  Calendar,
  Clock,
  FileText,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Paperclip
} from "lucide-react";
import { notFound } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";

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

  const isOverdue = assignment.deadline && new Date() > new Date(assignment.deadline);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Assignment Info */}
      <Card className="border-t-4 border-t-indigo-600 shadow-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <Badge variant="default" className="mb-2">
                {assignment.subject?.name || "Subject"}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{assignment.title}</h1>
            </div>
            {submission ? (
              <Badge variant={submission.status === 'graded' ? "success" : "info"}>
                <CheckCircle2 className="w-4 h-4 mr-1"/> 
                {submission.status === 'graded' ? 'Graded' : 'Submitted'}
              </Badge>
            ) : isOverdue ? (
              <Badge variant="danger">
                <AlertCircle className="w-4 h-4 mr-1"/> Overdue
              </Badge>
            ) : (
              <Badge variant="warning">
                <Clock className="w-4 h-4 mr-1"/> Pending
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{assignment.teacher?.full_name || "Teacher"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Due: {formatDate(assignment.deadline)}</span>
            </div>
            {assignment.max_marks && (
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>{assignment.max_marks} Points</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody className="pt-2">
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-indigo-600"/>
              Instructions
            </h3>
            <div className="bg-white p-4 rounded-lg border whitespace-pre-wrap text-slate-700">
              {assignment.description || "No instructions provided."}
            </div>
          </div>

          {assignment.attachment_url && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-500 mb-2">Attachments</h3>
              <a 
                href={assignment.attachment_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors w-max"
              >
                <div className="bg-indigo-100 p-2 rounded">
                  <Paperclip className="w-4 h-4 text-indigo-700" />
                </div>
                <span className="text-sm font-medium text-indigo-700">View Attachment</span>
              </a>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Submission Section */}
      <h2 className="text-2xl font-bold tracking-tight mt-8">Your Work</h2>
      
      {submission ? (
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader>
            <h3 className="text-lg flex justify-between items-center">
              Submission Details
              {submission.status === 'graded' && (
                <span className="text-green-600 font-bold text-xl">
                  {submission.marks} / {assignment.max_marks}
                </span>
              )}
            </h3>
            <div className="text-sm text-slate-500">
              Submitted on {formatDate(submission.submitted_at || submission.created_at || new Date().toISOString())}
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {submission.text_answer && (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 mb-1">Your Answer:</h4>
                <div className="p-3 bg-slate-50 border rounded-lg text-slate-700 whitespace-pre-wrap">
                  {submission.text_answer}
                </div>
              </div>
            )}
            
            {submission.file_url && (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 mb-1">Attached Work:</h4>
                <a 
                  href={submission.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-600 hover:underline"
                >
                  <Paperclip className="w-4 h-4" />
                  View Submitted File
                </a>
              </div>
            )}

            {submission.feedback && (
              <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Teacher Feedback:
                </h4>
                <p className="text-indigo-800">{submission.feedback}</p>
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <h3 className="text-lg">Submit Assignment</h3>
            <div className="text-sm text-slate-500">
              Provide a text response, a link to your work, or an uploaded file URL.
            </div>
          </CardHeader>
          <CardBody>
            <form action={submitAssignment} className="space-y-4">
              <input type="hidden" name="assignment_id" value={assignmentId} />
              
              <div className="space-y-2">
                <label htmlFor="text_answer" className="text-sm font-medium text-slate-700">Text Response</label>
                <textarea
                  id="text_answer"
                  name="text_answer"
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Type your answer here..."
                ></textarea>
              </div>

              <div className="space-y-2">
                <label htmlFor="file_url" className="text-sm font-medium text-slate-700">File URL / Link</label>
                <Input
                  id="file_url"
                  name="file_url"
                  type="url"
                  placeholder="https://docs.google.com/..."
                />
                <p className="text-xs text-slate-500">Provide a link to your Google Doc, Drive folder, or uploaded file.</p>
              </div>

              <Button type="submit" className="w-full sm:w-auto" disabled={isOverdue && false}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Turn In Assignment
              </Button>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
