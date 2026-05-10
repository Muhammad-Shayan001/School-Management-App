'use client';

import { useState, useEffect } from 'react';
import { getAdminSyllabi, deleteSyllabus, getClasses, getSubjects } from '@/app/_lib/actions/syllabus';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { Plus, LayoutList, Search, Filter } from 'lucide-react';
import SyllabusCard from '@/app/_components/syllabus/SyllabusCard';
import SyllabusCreator from '@/app/_components/syllabus/SyllabusCreator';

export default function AdminSyllabusPage() {
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [sylResult, clsResult, subResult] = await Promise.all([
      getAdminSyllabi(),
      getClasses(),
      getSubjects()
    ]);
    setSyllabi(sylResult.data || []);
    setClasses(clsResult.data || []);
    setSubjects(subResult.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="default" className="bg-accent/5 text-accent border-accent/20 font-black px-3 py-1 uppercase text-[10px]">
               Administrative Control
             </Badge>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter">Syllabus Directory</h1>
          <p className="text-text-secondary font-medium mt-1">Review and manage course structures across all classes.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="rounded-2xl h-12 px-8 font-black gap-2 bg-accent shadow-xl shadow-accent/20">
            <Plus className="h-5 w-5" /> Design New Syllabus
          </Button>
        )}
      </div>

      {isCreating ? (
        <SyllabusCreator 
          classes={classes} 
          subjects={subjects} 
          isAdmin={true}
          onCancel={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            loadData();
          }}
        />
      ) : (
        <>
          {/* Simple Search/Filter Bar */}
          <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input 
                type="text" 
                placeholder="Search syllabi..." 
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-bg-secondary/30 text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>
            <Button variant="outline" className="h-11 rounded-xl border-border/50 font-bold gap-2">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>

          {syllabi.length === 0 ? (
            <div className="py-24 text-center glass-card bg-bg-secondary/30 rounded-3xl border-2 border-dashed border-border">
              <LayoutList className="h-16 w-16 text-text-tertiary/30 mx-auto mb-4" />
              <h3 className="text-xl font-black text-text-primary mb-2">No syllabus available yet</h3>
              <p className="text-text-secondary font-medium mb-6">Create the first academic syllabus for your school.</p>
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
                  isAdmin={true}
                  onDelete={async (id) => {
                    await deleteSyllabus(id);
                    loadData();
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

