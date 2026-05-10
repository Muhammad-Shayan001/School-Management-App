import TeacherResultsClient from './TeacherResultsClient';

export default function TeacherResultsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight">Result Management</h1>
        <p className="mt-1 text-sm text-text-secondary font-medium">
          Enter and manage academic results for your assigned subjects and classes.
        </p>
      </div>

      <TeacherResultsClient />
    </div>
  );
}
