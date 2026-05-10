import { getStudentFinalResult } from '@/app/_lib/actions/results';
import { Card } from '@/app/_components/ui/card';
import { Badge } from '@/app/_components/ui/badge';
import { BarChart3, Award, GraduationCap, Clock, AlertCircle, BookOpen } from 'lucide-react';

export default async function StudentResultsPage() {
  const { data: result, breakdown, error } = await getStudentFinalResult();

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight">Academic Results</h1>
        <p className="mt-1 text-sm text-text-secondary font-medium">
          View your official academic performance report.
        </p>
      </div>

      {error ? (
        <div className="p-4 bg-danger/10 text-danger rounded-xl flex gap-3">
          <AlertCircle className="h-5 w-5" />
          <span className="font-bold">Failed to load results: {error}</span>
        </div>
      ) : !result ? (
        <div className="glass-card p-16 text-center">
          <Clock className="h-16 w-16 text-text-tertiary mx-auto mb-4 opacity-50"/>
          <p className="text-xl font-black text-text-primary">Results Not Yet Published</p>
          <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">Your class teacher has not published the final results yet. Please check back later.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Result Card */}
          <Card className="card-standard p-0 overflow-hidden bg-white shadow-2xl relative border-none rounded-3xl group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
              <Award className="h-48 w-48 text-accent group-hover:scale-110 transition-transform duration-700" />
            </div>
            
            <div className="p-10 border-b border-border/50 bg-bg-tertiary/10 flex flex-col md:flex-row justify-between md:items-center gap-8 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                   <Badge variant="accent" dot>{result.term}</Badge>
                   <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Official Record</span>
                </div>
                <h2 className="text-4xl font-black text-text-primary tracking-tighter leading-tight">Academic Report Card</h2>
                <div className="flex items-center gap-2 text-text-secondary font-bold text-sm">
                  <GraduationCap className="h-4 w-4 text-accent" />
                  Class Teacher: {result.publisher?.full_name || 'Assigned Faculty'}
                </div>
              </div>
              <div className="flex flex-row md:flex-col items-center md:items-end gap-4 bg-white/50 md:bg-transparent p-6 md:p-0 rounded-3xl border md:border-none border-border/30">
                <div className="text-left md:text-right">
                   <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest mb-1">Final Merit Grade</p>
                   <div className="h-20 w-20 rounded-[2rem] bg-accent text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-accent/30 ring-8 ring-accent/10">
                     {result.final_grade}
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/30 relative z-10">
              <div className="p-8 text-center group/item hover:bg-bg-tertiary/30 transition-colors">
                <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest mb-2">Total Points</p>
                <p className="text-3xl font-black text-text-primary">{result.total_marks}</p>
              </div>
              <div className="p-8 text-center group/item hover:bg-bg-tertiary/30 transition-colors">
                <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest mb-2">Obtained</p>
                <p className="text-3xl font-black text-accent">{result.obtained_marks}</p>
              </div>
              <div className="p-8 text-center group/item hover:bg-bg-tertiary/30 transition-colors">
                <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest mb-2">Percentage</p>
                <p className="text-3xl font-black text-text-primary">{result.percentage}%</p>
              </div>
              <div className="p-8 text-center group/item hover:bg-bg-tertiary/30 transition-colors">
                <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest mb-2">Published</p>
                <div className="flex items-center justify-center gap-2 text-sm font-black text-text-primary mt-1">
                  <Clock className="h-4 w-4 text-accent" />
                  {new Date(result.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </Card>

          {/* Subject Breakdown */}
          <Card className="card-standard p-0 overflow-hidden bg-white border-border/50 shadow-2xl rounded-3xl">
            <div className="p-8 border-b border-border/50 bg-bg-secondary/30">
              <h3 className="text-xl font-black text-text-primary tracking-tight flex items-center gap-3 uppercase">
                <BarChart3 className="h-6 w-6 text-accent" /> Subject-wise Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-tertiary/30 border-b border-border/50">
                    <th className="px-8 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest">Academic Subject</th>
                    <th className="px-8 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-right">Maximum</th>
                    <th className="px-8 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-right">Obtained</th>
                    <th className="px-8 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center">Merit Grade</th>
                    <th className="px-8 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest">Faculty Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {breakdown?.map((subject) => (
                    <tr key={subject.id} className="hover:bg-bg-tertiary/20 transition-all duration-300 group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-bg-tertiary flex items-center justify-center border border-border/30 group-hover:scale-110 transition-transform">
                             <BookOpen className="h-5 w-5 text-accent" />
                          </div>
                          <span className="text-base font-black text-text-primary tracking-tight">{subject.subjects?.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-base font-bold text-text-secondary text-right">{subject.total_marks}</td>
                      <td className="px-8 py-6 text-base font-black text-accent text-right">{subject.marks}</td>
                      <td className="px-8 py-6 text-center">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-bg-tertiary border border-border/50 font-black text-text-primary shadow-sm group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all">
                          {subject.grade}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm text-text-tertiary font-bold italic opacity-80">{subject.remarks || 'Excellent performance.'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      )}
    </div>
  );
}
