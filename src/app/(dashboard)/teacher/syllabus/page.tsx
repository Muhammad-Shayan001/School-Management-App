'use client';

import { useState, useEffect } from 'react';
import { getTeacherAssignments, getTeacherSyllabi, deleteSyllabus, getClasses, getSubjects } from '@/app/_lib/actions/syllabus';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { Plus, LayoutList, BookOpen } from 'lucide-react';
import SyllabusCard from '@/app/_components/syllabus/SyllabusCard';
import SyllabusCreator from '@/app/_components/syllabus/SyllabusCreator';

export default function TeacherSyllabusPage() {
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [syllabiRes, assignRes, clsRes, subRes] = await Promise.all([
      getTeacherSyllabi(),
      getTeacherAssignments(),
      getClasses(),
      getSubjects()
    ]);
    setSyllabi(syllabiRes.data || []);
    setAssignments(assignRes.data || []);
    setClasses(clsRes.data || []);
    setSubjects(subRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="default" className="bg-accent/5 text-accent border-accent/20 font-black px-3 py-1 uppercase text-[10px]">
               Instructional Planning
             </Badge>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter">My Course Outlines</h1>
          <p className="text-text-secondary font-medium mt-1">Structure and manage course content for your assigned classes.</p>
        </div>
        {!isCreating && assignments.length > 0 && (
          <Button onClick={() => setIsCreating(true)} className="rounded-2xl h-12 px-8 font-black gap-2 bg-accent shadow-xl shadow-accent/20">
            <Plus className="h-5 w-5" /> Create Syllabus
          </Button>
        )}
      </div>

      {isCreating ? (
        <SyllabusCreator 
          // Use unique classes and subjects to avoid key warnings
          classes={Array.from(new Map(assignments.map(a => [a.classes.id, a.classes])).values())} 
          subjects={Array.from(new Map(assignments.map(a => [a.subjects.id, a.subjects])).values())}
          onCancel={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            loadData();
          }}
        />
      ) : assignments.length === 0 ? (
        <div className="py-24 text-center glass-card bg-bg-secondary/30 rounded-3xl border-2 border-dashed border-border">
          <BookOpen className="h-16 w-16 text-text-tertiary/30 mx-auto mb-4" />
          <h3 className="text-xl font-black text-text-primary mb-2">No subjects assigned</h3>
          <p className="text-text-secondary font-medium">You must be assigned to a class and subject to create a syllabus.</p>
        </div>
      ) : syllabi.length === 0 ? (
        <div className="py-24 text-center glass-card bg-bg-secondary/30 rounded-3xl border-2 border-dashed border-border">
          <LayoutList className="h-16 w-16 text-text-tertiary/30 mx-auto mb-4" />
          <h3 className="text-xl font-black text-text-primary mb-2">No syllabus available yet</h3>
          <p className="text-text-secondary font-medium mb-6">Create your first course structure by clicking below.</p>
          <Button onClick={() => setIsCreating(true)} className="rounded-xl font-black gap-2">
            <Plus className="h-4 w-4" /> Create Syllabus
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {syllabi.map((syl) => (
            <SyllabusCard 
              key={syl.id} 
              syllabus={syl} 
              isOwner={true}
              onDelete={async (id) => {
                await deleteSyllabus(id);
                loadData();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

