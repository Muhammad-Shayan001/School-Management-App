import ClassTeacherResultsClient from './ClassTeacherResultsClient';

export default function ClassTeacherResultsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight">Class Result Compilation</h1>
        <p className="mt-1 text-sm text-text-secondary font-medium">
          Review subject marks and publish the final result for your assigned class.
        </p>
      </div>

      <ClassTeacherResultsClient />
    </div>
  );
}
