'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Trash2, Edit, LayoutGrid, List, Search,
  GraduationCap, Loader2, Building2, CheckCircle2, ChevronRight, XCircle, FileText
} from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { cn } from '@/app/_lib/utils/cn';
import { toast } from 'sonner';
import { 
  getClasses, getSchoolInfoForAdmin, addClass, deleteClass,
  getCourses, addCourse, deleteCourse 
} from '@/app/_lib/actions/schools';

export default function ClassroomsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'classes' | 'courses'>('classes');
  
  // Modals
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [className, setClassName] = useState('');
  const [classSection, setClassSection] = useState('A');
  const [courseName, setCourseName] = useState('');
  const [courseDesc, setCourseDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    
    // Load school info first to know if we need courses
    const infoRes = await getSchoolInfoForAdmin();
    if (infoRes.data) {
      setSchoolInfo(infoRes.data);
      
      const [classesRes, coursesRes] = await Promise.all([
        getClasses(infoRes.data.id),
        infoRes.data.institution_type === 'academy' ? getCourses() : Promise.resolve({ data: [] })
      ]);
      
      if (classesRes.data) setClasses(classesRes.data);
      if (coursesRes.data) setCourses(coursesRes.data);
    }
    
    setIsLoading(false);
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault();
    if (!className.trim()) return;
    
    setIsSubmitting(true);
    const result = await addClass(className, classSection);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Class added successfully');
      setIsAddClassModalOpen(false);
      setClassName('');
      setClassSection('A');
      await loadData();
    }
    setIsSubmitting(false);
  }

  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!courseName.trim()) return;
    
    setIsSubmitting(true);
    const result = await addCourse(courseName, courseDesc);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Course added successfully');
      setIsAddCourseModalOpen(false);
      setCourseName('');
      setCourseDesc('');
      await loadData();
    }
    setIsSubmitting(false);
  }

  async function handleDeleteClass(id: string, name: string) {
    if (confirm(`Are you sure you want to delete ${name}? This may affect students assigned to it.`)) {
      const result = await deleteClass(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Class deleted successfully');
        await loadData();
      }
    }
  }

  async function handleDeleteCourse(id: string, name: string) {
    if (confirm(`Are you sure you want to delete ${name}? This may affect students enrolled in it.`)) {
      const result = await deleteCourse(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Course deleted successfully');
        await loadData();
      }
    }
  }

  const isAcademy = schoolInfo?.institution_type === 'academy';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
              <BookOpen className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-text-primary tracking-tight">
                {isAcademy ? 'Classes & Courses' : 'Classrooms'}
              </h1>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mt-0.5">
                Manage academic structures
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'classes' ? (
            <button
              onClick={() => setIsAddClassModalOpen(true)}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-accent text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:shadow-2xl hover:shadow-accent/30 transition-all hover:-translate-y-0.5"
            >
              <Plus className="h-4.5 w-4.5" />
              Add Class
            </button>
          ) : (
            <button
              onClick={() => setIsAddCourseModalOpen(true)}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-accent text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:shadow-2xl hover:shadow-accent/30 transition-all hover:-translate-y-0.5"
            >
              <Plus className="h-4.5 w-4.5" />
              Add Course
            </button>
          )}
        </div>
      </div>

      {isAcademy && (
        <div className="flex gap-2 mb-8 bg-bg-tertiary/50 p-1 rounded-2xl border border-border/30 w-max">
          <button
            onClick={() => setActiveTab('classes')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              activeTab === 'classes' ? "bg-white text-accent shadow-md" : "text-text-tertiary hover:text-text-primary"
            )}
          >
            Classes
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              activeTab === 'courses' ? "bg-white text-accent shadow-md" : "text-text-tertiary hover:text-text-primary"
            )}
          >
            Courses
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
          <p className="text-xs font-black text-text-tertiary uppercase tracking-widest">Loading structure...</p>
        </div>
      ) : activeTab === 'classes' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
          {classes.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white/50 border border-dashed rounded-3xl">
              <BookOpen className="h-12 w-12 text-text-tertiary/50 mx-auto mb-3" />
              <p className="text-text-secondary font-medium">No classes defined yet.</p>
            </div>
          ) : (
            classes.map(cls => (
              <div key={cls.id} className="bg-white p-5 rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-text-primary">{cls.name}</h3>
                  <button 
                    onClick={() => handleDeleteClass(cls.id, cls.name)}
                    className="text-text-tertiary hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {cls.section && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-bg-tertiary text-text-secondary">
                    Section {cls.section}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {courses.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white/50 border border-dashed rounded-3xl">
              <FileText className="h-12 w-12 text-text-tertiary/50 mx-auto mb-3" />
              <p className="text-text-secondary font-medium">No courses defined yet.</p>
            </div>
          ) : (
            courses.map(course => (
              <div key={course.id} className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all group relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <button 
                    onClick={() => handleDeleteCourse(course.id, course.name)}
                    className="text-text-tertiary hover:text-danger hover:bg-danger/10 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="font-black text-xl text-text-primary mb-2 line-clamp-1">{course.name}</h3>
                {course.description && (
                  <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Class Modal */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddClassModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-6 md:p-8 animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-text-primary mb-1">Add New Class</h2>
            <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-6">Create a new classroom</p>
            
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1 mb-1 block">Class Name *</label>
                <Input
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Class 1, Batch A"
                  className="bg-bg-tertiary/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1 mb-1 block">Section</label>
                <Input
                  value={classSection}
                  onChange={(e) => setClassSection(e.target.value)}
                  placeholder="e.g. A"
                  className="bg-bg-tertiary/50"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddClassModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="flex-[2] btn-primary">
                  Create Class
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddCourseModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-6 md:p-8 animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-text-primary mb-1">Add New Course</h2>
            <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-6">Create a new course offering</p>
            
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1 mb-1 block">Course Name *</label>
                <Input
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Web Development"
                  className="bg-bg-tertiary/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1 mb-1 block">Description</label>
                <textarea
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  placeholder="Short description about the course..."
                  rows={3}
                  className="w-full bg-bg-tertiary/50 border border-border/30 rounded-2xl py-3 px-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all resize-none"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddCourseModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="flex-[2] btn-primary">
                  Create Course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
