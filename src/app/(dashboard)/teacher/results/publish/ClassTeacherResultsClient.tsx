'use client';

import { useState, useEffect } from 'react';
import { getFullProfile } from '@/app/_lib/actions/profile';
import { getClassResults, publishFinalResults } from '@/app/_lib/actions/results';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { Award, CheckCircle2, AlertCircle, Share } from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';

export default function ClassTeacherResultsClient() {
  const [profile, setProfile] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data } = await getFullProfile();
      if (data && data.teacher?.is_class_teacher && data.teacher?.class_id) {
        setProfile(data);
        const { data: resData } = await getClassResults(data.teacher.class_id);
        if (resData) setResults(resData);
      } else {
        setProfile({ notClassTeacher: true });
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handlePublish = async () => {
    if (!profile?.teacher?.class_id) return;
    setIsPublishing(true);
    setMessage(null);

    const res = await publishFinalResults(profile.teacher.class_id);
    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Final Results Compiled and Published Successfully!' });
    }
    setIsPublishing(false);
  };

  if (isLoading) return <PageSpinner />;

  if (profile?.notClassTeacher) {
    return (
      <div className="glass-card p-12 text-center">
        <Award className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-50"/>
        <p className="text-text-secondary font-medium">Access Restricted</p>
        <p className="text-sm text-text-tertiary mt-1">This panel is only accessible to Class Teachers to merge and publish final results.</p>
      </div>
    );
  }

  // Group results by subject to see submission status
  const subjectsEntered = Array.from(new Set(results.map(r => r.subjects?.name)));
  
  return (
    <div className="space-y-6">
      {message && (
        <div className={cn("p-4 rounded-xl border flex items-center gap-3 animate-slide-up", 
          message.type === 'success' ? "bg-success/10 border-success/20 text-success" : "bg-danger/10 border-danger/20 text-danger"
        )}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-standard p-6 bg-white">
          <p className="text-xs text-text-tertiary font-black uppercase tracking-wider mb-1">Your Assigned Class</p>
          <p className="text-2xl font-black text-text-primary">{profile.teacher?.classes?.name} {profile.teacher?.classes?.section ? `- ${profile.teacher.classes.section}` : ''}</p>
        </Card>
        
        <Card className="card-standard p-6 bg-white">
          <p className="text-xs text-text-tertiary font-black uppercase tracking-wider mb-1">Subjects Entered</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {subjectsEntered.length === 0 ? <span className="text-sm text-text-tertiary">None</span> : 
              subjectsEntered.map(s => (
                <span key={s} className="px-2 py-1 bg-accent/10 text-accent text-xs font-bold rounded-lg border border-accent/20">
                  {s}
                </span>
              ))
            }
          </div>
        </Card>

        <Card className="card-standard p-6 bg-white flex flex-col justify-center items-center text-center">
          <Button 
            onClick={handlePublish} 
            isLoading={isPublishing} 
            disabled={results.length === 0}
            className="btn-primary w-full h-12 gap-2 shadow-xl shadow-accent/20 font-black"
          >
            <Share className="h-4 w-4" /> Compile & Publish Final Result
          </Button>
          <p className="text-[10px] text-text-tertiary mt-3">This will merge all subject marks and generate student report cards.</p>
        </Card>
      </div>

      <Card className="card-standard p-0 overflow-hidden bg-white">
        <div className="p-6 border-b border-border/50 bg-bg-secondary/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-text-primary tracking-tight">Raw Marks Overview — {profile.teacher?.classes?.name}</h2>
            <p className="text-xs text-text-tertiary font-medium">All marks submitted by subject teachers.</p>
          </div>
          <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-black rounded-full border border-accent/20">
            {profile.teacher?.classes?.name} {profile.teacher?.classes?.section ? `- ${profile.teacher.classes.section}` : ''}
          </span>
        </div>

        {results.length === 0 ? (
          <div className="p-12 text-center text-text-tertiary">No marks have been submitted for this class yet.</div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-bg-tertiary shadow-sm">
                <tr className="border-b border-border/50">
                  <th className="px-6 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-wider text-right">Marks</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-wider text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-bg-tertiary/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-bold text-text-secondary">
                      {(result.profiles?.student_profiles as any)?.[0]?.roll_number || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-text-primary">{result.profiles?.full_name}</td>
                    <td className="px-6 py-3 text-sm font-bold text-text-primary">{result.subjects?.name}</td>
                    <td className="px-6 py-3 text-sm font-black text-text-primary text-right">
                      <span className="text-accent">{result.marks}</span> / {result.total_marks}
                    </td>
                    <td className="px-6 py-3 text-center">
                       <span className="px-2 py-1 rounded-md bg-bg-tertiary border font-black text-xs">{result.grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
