'use client';

import { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, 
  BookOpen, Layers, Briefcase, GraduationCap,
  Camera, Check, X, Shield, Plus, Trash2
} from 'lucide-react';
import { Modal } from '@/app/_components/ui/modal';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { Select } from '@/app/_components/ui/select';
import { Badge } from '@/app/_components/ui/badge';
import { cn } from '@/app/_lib/utils/cn';
import { createManualTeacher, updateManualTeacherData } from '@/app/_lib/actions/users';
import { toast } from 'sonner';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  subjects: any[];
  onSuccess: (credentials: any) => void;
  editTeacher?: any | null;
}

export function AddTeacherModal({ isOpen, onClose, classes, subjects, onSuccess, editTeacher }: AddTeacherModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'male',
    cnic: '',
    address: '',
    city: '',
    country: 'Pakistan',
    qualification: '',
    experience: '',
    is_class_teacher: 'false',
    class_id: '',
    avatar_url: '',
    password: '',
    teacher_id: '',
    assignments: [] as any[]
  });

  useEffect(() => {
    if (isOpen && editTeacher) {
      setFormData({
        full_name: editTeacher.profiles?.full_name || '',
        email: editTeacher.profiles?.email || '',
        phone: editTeacher.phone || editTeacher.profiles?.phone || '',
        dob: editTeacher.dob || '',
        gender: editTeacher.gender || 'male',
        cnic: editTeacher.cnic || '',
        address: editTeacher.address || '',
        city: editTeacher.city || '',
        country: editTeacher.country || 'Pakistan',
        qualification: editTeacher.qualification || '',
        experience: editTeacher.experience || '',
        is_class_teacher: editTeacher.is_class_teacher ? 'true' : 'false',
        class_id: editTeacher.class_id || '',
        avatar_url: editTeacher.profiles?.avatar_url || '',
        password: '',
        teacher_id: editTeacher.teacher_id || '',
        assignments: editTeacher.assignments ? editTeacher.assignments.map((a: any) => ({ class_id: a.class_id, subject_id: a.subject_id })) : []
      });
      setPreviewImage(editTeacher.profiles?.avatar_url || null);
      setStep(1);
    } else if (isOpen && !editTeacher) {
      setFormData({
        full_name: '', email: '', phone: '', dob: '', gender: 'male',
        cnic: '', address: '', city: '', country: 'Pakistan',
        qualification: '', experience: '', is_class_teacher: 'false',
        class_id: '', avatar_url: '', password: '', teacher_id: '', assignments: []
      });
      setPreviewImage(null);
      setStep(1);
    }
  }, [isOpen, editTeacher]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addAssignment = () => {
    setFormData(prev => ({
      ...prev,
      assignments: [...prev.assignments, { class_id: '', subject_id: '' }]
    }));
  };

  const removeAssignment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assignments: prev.assignments.filter((_, i) => i !== index)
    }));
  };

  const updateAssignment = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      assignments: prev.assignments.map((a, i) => i === index ? { ...a, [field]: value } : a)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (editTeacher) {
        const result = await updateManualTeacherData(editTeacher.user_id, formData);
        if (result.success) {
          toast.success('Teacher record updated successfully!');
          onSuccess({ updated: true, email: formData.email });
          onClose();
        } else {
          toast.error(result.error || 'Failed to update teacher record');
        }
      } else {
        const result = await createManualTeacher(formData);
        if (result.success) {
          toast.success('Teacher account created successfully!');
          onSuccess(result.credentials);
          onClose();
          setFormData({
            full_name: '', email: '', phone: '', dob: '', gender: 'male',
            cnic: '', address: '', city: '', country: 'Pakistan',
            qualification: '', experience: '', is_class_teacher: 'false',
            class_id: '', avatar_url: '', password: '', teacher_id: '', assignments: []
          });
          setStep(1);
          setPreviewImage(null);
        } else {
          toast.error(result.error || 'Failed to create teacher');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editTeacher ? "Edit Teacher Profile & Master Record" : "Manual Faculty Enrollment"}
      size="xl"
      className="rounded-[3rem] overflow-hidden border-none"
    >
      <div className="space-y-8 p-4 sm:p-6 md:p-8 max-h-[85vh] overflow-y-auto scrollbar-premium">
        {/* Progress Stepper */}
        <div className="flex items-center justify-between px-4 md:px-10 relative">
           <div className="absolute top-1/2 left-4 right-4 md:left-10 md:right-10 h-0.5 bg-border/40 -z-10" />
           {[1, 2].map((s) => (
             <button 
               key={s}
               onClick={() => setStep(s)}
               className={cn(
                 "h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black transition-all duration-500",
                 step === s ? "bg-accent text-white shadow-xl shadow-accent/20 scale-110" : 
                 step > s ? "bg-success text-white shadow-lg" : "bg-white border-2 border-border/50 text-text-tertiary"
               )}
             >
                {step > s ? <Check className="h-4 w-4 md:h-5 md:w-5" /> : s}
             </button>
           ))}
        </div>

        {/* Step 1: Basic Info & Experience */}
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">
                <div className="relative group">
                   <div className={cn(
                     "h-32 w-32 md:h-48 md:w-48 rounded-[2rem] md:rounded-[2.5rem] bg-bg-tertiary border-2 border-dashed border-border/60 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-accent/40",
                     previewImage && "border-none"
                   )}>
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-8 w-8 md:h-10 md:w-10 text-text-tertiary/40" />
                      )}
                      <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                   </div>
                   <p className="text-[9px] md:text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center mt-4 md:mt-6">Faculty Portrait</p>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2 col-span-1 md:col-span-2">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Full Name</label>
                      <Input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="e.g. Dr. Salman Khan" className="h-12 md:h-14 rounded-2xl bg-bg-tertiary/50 border-transparent font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Work Email</label>
                      <Input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="salman@school.edu" className="h-12 md:h-14 rounded-2xl bg-bg-tertiary/50 border-transparent font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Phone Number</label>
                      <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+92 3XX XXXXXXX" className="h-12 md:h-14 rounded-2xl bg-bg-tertiary/50 border-transparent font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Account Password</label>
                      <Input name="password" value={formData.password} onChange={handleChange} placeholder="Auto-generated if left blank" className="h-12 md:h-14 rounded-2xl bg-bg-tertiary/50 border-transparent font-mono text-xs" />
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Qualification</label>
                   <Input name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. M.Phil in Physics" className="h-12 md:h-14 rounded-2xl bg-bg-tertiary/50 border-transparent font-bold" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Years of Experience</label>
                   <Input name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 5 Years" className="h-12 md:h-14 rounded-2xl bg-bg-tertiary/50 border-transparent font-bold" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">CNIC Number</label>
                   <Input name="cnic" value={formData.cnic} onChange={handleChange} placeholder="42101-XXXXXXX-X" className="h-12 md:h-14 rounded-2xl bg-bg-tertiary/50 border-transparent font-bold" />
                </div>
             </div>

             <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 md:pt-10 border-t border-border/40 mt-6">
                <Button variant="outline" onClick={onClose} className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-8 rounded-2xl font-black uppercase text-[10px] md:text-[11px] tracking-widest">Cancel</Button>
                <Button onClick={() => setStep(2)} className="w-full sm:w-auto h-12 md:h-14 px-8 md:px-10 rounded-2xl font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] shadow-xl shadow-accent/20 bg-accent text-white hover:bg-accent/90">Next: Assignments</Button>
             </div>
          </div>
        )}

        {/* Step 2: Academic Assignments */}
        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="p-8 rounded-[2.5rem] bg-bg-tertiary/40 border border-border/50">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-1 bg-accent rounded-full" />
                      <h4 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em]">Class Teacher Roles</h4>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Is Class Teacher?</label>
                      <Select 
                        value={formData.is_class_teacher}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_class_teacher: e.target.value }))}
                        options={[
                          { label: 'No', value: 'false' },
                          { label: 'Yes', value: 'true' }
                        ]}
                        className="h-14 rounded-2xl bg-white border-transparent font-black uppercase text-[10px] tracking-widest"
                      />
                   </div>
                   {formData.is_class_teacher === 'true' && (
                     <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Assigned Class</label>
                        <Select 
                          value={formData.class_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, class_id: e.target.value }))}
                          options={[
                            { label: 'Select Class', value: '' },
                            ...classes.map(c => ({ label: `${c.name}${c.section && c.section.toUpperCase() !== 'A' ? ` - ${c.section}` : ''}`, value: c.id }))
                          ]}
                          className="h-14 rounded-2xl bg-white border-transparent font-black uppercase text-[10px] tracking-widest"
                        />
                     </div>
                   )}
                </div>
             </div>

             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-1 bg-purple-500 rounded-full" />
                      <h4 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em]">Subject Load Assignments</h4>
                   </div>
                   <Button variant="outline" size="sm" onClick={addAssignment} className="rounded-xl border-dashed border-accent/40 text-accent h-10 px-4 font-black text-[10px] uppercase tracking-widest">
                      <Plus className="h-4 w-4 mr-2" /> Add Load
                   </Button>
                </div>

                <div className="space-y-4">
                   {formData.assignments.map((assignment, idx) => (
                     <div key={idx} className="grid grid-cols-1 md:grid-cols-11 gap-4 p-6 rounded-[2rem] bg-bg-tertiary/30 items-end border border-transparent hover:border-accent/10 transition-all duration-300">
                        <div className="md:col-span-5 space-y-2">
                           <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest ml-1">Class</label>
                           <Select 
                             value={assignment.class_id}
                             onChange={(e) => updateAssignment(idx, 'class_id', e.target.value)}
                             options={[
                               { label: 'Select Class', value: '' },
                               ...classes.map(c => ({ label: `${c.name}${c.section && c.section.toUpperCase() !== 'A' ? ` - ${c.section}` : ''}`, value: c.id }))
                             ]}
                             className="h-12 rounded-xl bg-white border-none font-bold text-xs"
                           />
                        </div>
                        <div className="md:col-span-5 space-y-2">
                           <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest ml-1">Subject</label>
                           {assignment.subject_id === 'other' ? (
                              <div className="flex gap-2">
                                 <Input 
                                   value={assignment.custom_subject || ''}
                                   onChange={(e) => updateAssignment(idx, 'custom_subject', e.target.value)}
                                   placeholder="Enter subject name..."
                                   className="h-12 rounded-xl bg-white border-none font-bold text-xs flex-1"
                                 />
                                 <Button variant="outline" size="sm" onClick={() => updateAssignment(idx, 'subject_id', '')} className="h-12 rounded-xl text-[10px] uppercase font-black tracking-wider">
                                   Cancel
                                 </Button>
                              </div>
                           ) : (
                              <Select 
                                value={assignment.subject_id}
                                onChange={(e) => updateAssignment(idx, 'subject_id', e.target.value)}
                                options={[
                                  { label: 'Select Subject', value: '' },
                                  ...subjects.map(s => ({ label: s.name, value: s.id })),
                                  { label: 'Other (Add new)', value: 'other' }
                                ]}
                                className="h-12 rounded-xl bg-white border-none font-bold text-xs"
                              />
                           )}
                        </div>
                        <div className="md:col-span-1 flex justify-center">
                             <Button variant="outline" onClick={() => removeAssignment(idx)} className="h-12 w-12 p-0 flex items-center justify-center rounded-xl text-rose-500 border-none hover:bg-rose-50">
                              <Trash2 className="h-5 w-5" />
                           </Button>
                        </div>
                     </div>
                   ))}
                   {formData.assignments.length === 0 && (
                     <div className="py-10 text-center border-2 border-dashed border-border/30 rounded-[2rem]">
                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest italic">No subjects assigned yet</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-6 md:pt-10 border-t border-border/40 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-8 rounded-2xl font-black uppercase text-[10px] md:text-[11px] tracking-widest whitespace-nowrap">Back</Button>
                <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-12 rounded-2xl font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] shadow-2xl shadow-accent/20 bg-accent text-white hover:bg-accent-hover whitespace-nowrap"
                >
                  {loading ? 'Processing...' : editTeacher ? 'Save Changes' : 'Complete Onboarding'}
                </Button>
             </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
