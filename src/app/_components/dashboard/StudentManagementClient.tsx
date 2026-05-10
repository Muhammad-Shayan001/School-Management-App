'use client';

import { useState, useEffect } from 'react';
import { getStudentProfiles, createOrUpdateStudentProfile, deleteStudentProfile } from '@/app/_lib/actions/users';
import { getClasses } from '@/app/_lib/actions/schools';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Select } from '@/app/_components/ui/select';
import { Modal } from '@/app/_components/ui/modal';
import { Avatar } from '@/app/_components/ui/avatar';
import { Search, Plus, Edit2, Users, Save, Trash2 } from 'lucide-react';
import { PageSpinner } from '@/app/_components/ui/spinner';

export function StudentManagementClient({ role }: { role: 'teacher' | 'admin' | 'super_admin' }) {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [query, filterClass]);

  async function fetchData() {
    setIsLoading(true);
    const [studentsRes, classesRes] = await Promise.all([
      getStudentProfiles({ query, class_id: filterClass || undefined }),
      getClasses()
    ]);
    
    if (studentsRes.data) setStudents(studentsRes.data);
    if (classesRes.data) setClasses(classesRes.data);
    setIsLoading(false);
  }

  function handleEdit(student: any) {
    setEditingStudent(student);
    setFormData({
      user_id: student.user_id,
      full_name: student.profiles?.full_name || '',
      email: student.profiles?.email || '',
      phone: student.profiles?.phone || '',
      roll_number: student.roll_number || '',
      class_id: student.class_id || '',
      section: student.section || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      address: student.address || '',
      gender: student.gender || 'male',
      dob: student.dob || '',
    });
    setError(null);
    setIsModalOpen(true);
  }

  function handleCreate() {
    setEditingStudent(null);
    setFormData({
      gender: 'male',
    });
    setError(null);
    setIsModalOpen(true);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const submission = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (val) submission.append(key, val as string);
    });

    const res = await createOrUpdateStudentProfile(submission);
    setIsSaving(false);
    
    if (res.error) {
      setError(res.error);
    } else {
      setIsModalOpen(false);
      fetchData();
    }
  }

  async function handleDelete(studentId: string) {
    if (!confirm('Are you sure you want to delete this student profile permanently?')) return;
    setIsLoading(true);
    await deleteStudentProfile(studentId);
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Student Management</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {role === 'teacher' ? 'Manage students in your assigned classes' : 'Manage all student profiles'}
          </p>
        </div>
        <Button onClick={handleCreate} className="btn-primary gap-2" leftIcon={<Plus className="h-4 w-4" />}>
          New Student
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 glass-card p-4 rounded-2xl">
        <div className="flex-1">
          <Input
            name="search"
            placeholder="Search by name, roll number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            name="class_filter"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            options={[
              { value: '', label: 'All Classes' },
              ...classes.map(c => ({ value: c.id, label: `${c.name} ${c.section ? `- ${c.section}` : ''}` }))
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <PageSpinner label="Loading students..." />
      ) : students.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-50" />
          <p className="text-text-secondary font-medium">No students found</p>
          <p className="text-xs text-text-tertiary mt-1">If you are a teacher without an assigned class, you will not see any students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(student => (
            <div key={student.user_id} className="glass-card p-5 space-y-4 hover:border-accent/30 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar src={student.profiles?.avatar_url} name={student.profiles?.full_name || 'S'} size="md" />
                  <div>
                    <h3 className="font-bold text-text-primary text-sm truncate max-w-[150px]">{student.profiles?.full_name}</h3>
                    <p className="text-xs text-text-secondary">{student.roll_number || 'No Roll No'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(student)} className="h-8 w-8 p-0 shrink-0">
                    <Edit2 className="h-4 w-4 text-text-tertiary hover:text-accent" />
                  </Button>
                  {(role === 'admin' || role === 'super_admin') && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(student.user_id)} className="h-8 w-8 p-0 shrink-0 text-danger hover:text-danger hover:bg-danger/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/50 text-sm">
                <div className="flex justify-between text-xs">
                  <span className="text-text-tertiary">Class:</span>
                  <span className="font-medium text-text-primary">{student.classes?.name} {student.classes?.section ? `- ${student.classes.section}` : ''}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-tertiary">Parent:</span>
                  <span className="font-medium text-text-primary truncate max-w-[120px]">{student.parent_name || '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-tertiary">Contact:</span>
                  <span className="font-medium text-text-primary">{student.parent_phone || student.profiles?.phone || '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStudent ? "Edit Student Profile" : "Create New Student"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg border border-danger/20">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" name="full_name" value={formData.full_name || ''} onChange={handleInputChange} required />
            {!editingStudent && <Input label="Email (Optional)" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} placeholder="Will auto-generate if empty" />}
            
            <Input label="Roll Number" name="roll_number" value={formData.roll_number || ''} onChange={handleInputChange} required />
            <Select 
              label="Class" 
              name="class_id" 
              value={formData.class_id || ''} 
              onChange={handleInputChange}
              options={[{ value: '', label: 'Select Class' }, ...classes.map(c => ({ value: c.id, label: `${c.name} ${c.section ? `- ${c.section}` : ''}` }))]}
              required
            />
            
            <Input label="Parent Name" name="parent_name" value={formData.parent_name || ''} onChange={handleInputChange} />
            <Input label="Parent Phone" name="parent_phone" value={formData.parent_phone || ''} onChange={handleInputChange} />
            <Select 
              label="Gender" 
              name="gender" 
              value={formData.gender || ''} 
              onChange={handleInputChange}
              options={[{value: 'male', label: 'Male'}, {value: 'female', label: 'Female'}]}
            />
            <Input label="Date of Birth" name="dob" type="date" value={formData.dob || ''} onChange={handleInputChange} />
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving} className="btn-primary" leftIcon={<Save className="h-4 w-4" />}>
              Save Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
