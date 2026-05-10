'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFullProfile, updateProfile } from '@/app/_lib/actions/profile';
import { getPublicClasses } from '@/app/_lib/actions/schools';
import { ImageUpload } from '@/app/_components/ui/image-upload';
import { Input } from '@/app/_components/ui/input';
import { Select } from '@/app/_components/ui/select';
import { Button } from '@/app/_components/ui/button';
import { Card } from '@/app/_components/ui/card';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  Save, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Briefcase,
  IdCard,
  School,
  Mail,
  Info,
  Award,
  Clock,
  Users
} from 'lucide-react';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { cn } from '@/app/_lib/utils/cn';

// Helper for CNIC masking (Pakistan format: 00000-0000000-0)
const formatCNIC = (val: string) => {
  const digits = val.replace(/\D/g, '');
  let formatted = '';
  if (digits.length > 0) formatted += digits.substring(0, 5);
  if (digits.length > 5) formatted += '-' + digits.substring(5, 12);
  if (digits.length > 12) formatted += '-' + digits.substring(12, 13);
  return formatted;
};

import { getTeacherAssignments } from '@/app/_lib/actions/results';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [assignments, setAssignments] = useState<{subject_name: string, class_id: string}[]>([{subject_name: '', class_id: ''}]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data } = await getFullProfile();
      if (data) {
        setProfile(data);
        setAvatarUrl(data.avatar_url || '');
        
        // Map database fields to form state
        const baseData: Record<string, any> = {
          full_name: data.full_name || '',
          phone: data.phone || '',
          email: data.email || '',
        };

        if (data.role === 'student') {
          const s = data.student || {};
          Object.assign(baseData, {
            cnic: s.cnic || '',
            roll_number: s.roll_number || '',
            class_id: s.class_id || '',
            section: s.section || '',
            dob: s.dob || '',
            gender: s.gender || 'male',
            student_email: s.student_email || '',
            parent_name: s.parent_name || '',
            parent_cnic: s.parent_cnic || '',
            parent_phone: s.parent_phone || '',
            address: s.address || '',
            admission_date: s.admission_date || '',
          });
        } else if (data.role === 'teacher') {
          const t = data.teacher || {};
          Object.assign(baseData, {
            cnic: t.cnic || '',
            teacher_id: t.teacher_id || '',
            subjects: t.subjects || '',
            is_class_teacher: t.is_class_teacher || false,
            class_id: t.class_id || '',
            qualification: t.qualification || '',
            experience: t.experience || '',
            address: t.address || '',
          });

          // Fetch existing assignments
          const { data: existingAssignments } = await getTeacherAssignments();
          if (existingAssignments && existingAssignments.length > 0) {
            setAssignments(existingAssignments.map((a: any) => ({
              subject_name: a.subjects?.name || '',
              class_id: a.class_id || ''
            })));
          }
        } else if ((data.role === 'admin' || data.role === 'super_admin')) {
          const a = data.admin || {};
          Object.assign(baseData, {
            cnic: a.cnic || '',
            school_name: data.schools?.name || '',
            school_address: data.schools?.address || '',
            address: a.address || '',
          });
        }

        setFormData(baseData);

        if (data.school_id) {
          const { data: classList } = await getPublicClasses(data.school_id);
          setClasses(classList || []);
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    let val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    // Apply CNIC masking for specific fields
    if (name === 'cnic' || name === 'parent_cnic') {
      val = formatCNIC(val);
    }

    setFormData(prev => ({ ...prev, [name]: val }));
    setError(null);
  };

  const handleNext = () => {
    if (step === 1 && !formData.full_name) {
      setError("Full Name is required.");
      return;
    }
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };
  
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);

    const submission = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submission.append(key, String(value));
    });
    submission.append('avatar_url', avatarUrl);
    
    if (role === 'teacher') {
      submission.append('assignments', JSON.stringify(assignments));
    }

    try {
      const result = await updateProfile(submission);
      if (result.success) {
        router.push('/profile');
        router.refresh();
      } else {
        setError(result.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageSpinner />;

  const role = profile?.role;
  const totalSteps = 2;

  return (
    <div className="min-h-screen bg-bg-primary py-12 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-[2rem] bg-accent/10 mb-2 rotate-3 shadow-xl shadow-accent/5">
            <Sparkles className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">
            Professional Profile Setup
          </h1>
          <p className="text-text-secondary max-w-lg mx-auto">
            Please provide accurate details to ensure your digital faculty/student record remains valid and synchronized.
          </p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {[1, 2].map((i) => (
              <div key={i} className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                step === i ? "w-12 bg-accent" : "w-4 bg-border"
              )} />
            ))}
          </div>
        </div>

        <Card className="card-standard max-w-3xl mx-auto p-10 border-border/40 shadow-2xl shadow-black/5">
          {error && (
            <div className="mb-8 p-4 bg-danger/10 text-danger text-sm font-bold rounded-2xl border border-danger/20 flex items-center gap-3 animate-slide-up">
              <Info className="h-5 w-5" />
              {error}
            </div>
          )}

          <div className="space-y-10">
            {step === 1 && (
              <div className="space-y-10 animate-fade-in">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-bg-tertiary/30 border border-border/50 border-dashed">
                  <ImageUpload 
                    currentImageUrl={avatarUrl}
                    onUploadComplete={setAvatarUrl}
                    userId={profile?.id}
                  />
                  <div className="text-center">
                    <p className="text-sm font-bold text-text-primary">Profile Identity Photo</p>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-widest mt-1">PNG or JPG, Max 1MB</p>
                  </div>
                </div>

                {/* Base Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <Input 
                      label="Full Name (As per CNIC/Passport)" 
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Muhammad Shayan"
                      leftIcon={<User className="h-5 w-5" />}
                      required
                    />
                  </div>
                  
                  <Input 
                    label={role === 'student' ? "CNIC / B-Form Number" : "CNIC Number"} 
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    placeholder="00000-0000000-0"
                    leftIcon={<IdCard className="h-5 w-5" />}
                    maxLength={15}
                    required
                  />

                  <Input 
                    label="Official Email Address" 
                    name="email"
                    value={formData.email}
                    disabled
                    leftIcon={<Mail className="h-5 w-5" />}
                    className="opacity-70 bg-bg-tertiary/50"
                  />

                  <Input 
                    label="Personal Phone Number" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92 000 0000000"
                    leftIcon={<Phone className="h-5 w-5" />}
                    required
                  />

                  {(role === 'admin' || role === 'super_admin') && (
                    <Input 
                      label="Current School Name" 
                      name="school_name"
                      value={formData.school_name}
                      onChange={handleInputChange}
                      placeholder="Enter school name"
                      leftIcon={<School className="h-5 w-5" />}
                      required
                    />
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 animate-fade-in">
                {/* Role Specific Forms */}
                
                {role === 'student' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Input 
                        label="Roll Number" 
                        name="roll_number"
                        value={formData.roll_number}
                        onChange={handleInputChange}
                        placeholder="e.g. 2024-ST-001"
                        leftIcon={<Award className="h-5 w-5" />}
                        required
                      />
                      <Select 
                        label="Academic Class" 
                        name="class_id"
                        value={formData.class_id}
                        onChange={handleInputChange}
                        options={[
                          { value: '', label: 'Select your class' },
                          ...classes.map(c => ({ value: c.id, label: `${c.name} ${c.section ? `- ${c.section}` : ''}` }))
                        ]}
                        required
                      />
                      <Input 
                        label="Section" 
                        name="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        placeholder="e.g. Alpha"
                      />
                      <Input 
                        label="Date of Birth" 
                        name="dob"
                        type="date"
                        value={formData.dob}
                        onChange={handleInputChange}
                        leftIcon={<Calendar className="h-5 w-5" />}
                      />
                      <Select 
                        label="Gender" 
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        options={[
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                          { value: 'other', label: 'Other' }
                        ]}
                      />
                      <Input 
                        label="Student Personal Email (Optional)" 
                        name="student_email"
                        type="email"
                        value={formData.student_email}
                        onChange={handleInputChange}
                        placeholder="student@edu.com"
                      />
                      
                      <div className="md:col-span-2 pt-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                            <Shield className="h-4 w-4" />
                          </div>
                          <h3 className="font-black text-text-primary">Parent / Guardian Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <Input label="Guardian Name" name="parent_name" value={formData.parent_name} onChange={handleInputChange} required />
                          <Input label="Guardian CNIC" name="parent_cnic" value={formData.parent_cnic} onChange={handleInputChange} placeholder="00000-0000000-0" maxLength={15} />
                          <Input label="Guardian Contact" name="parent_phone" value={formData.parent_phone} onChange={handleInputChange} required />
                          <Input label="Admission Date" name="admission_date" type="date" value={formData.admission_date} onChange={handleInputChange} />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Input 
                          label="Residential Address" 
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          leftIcon={<MapPin className="h-5 w-5" />}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {role === 'teacher' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input label="Unique Teacher ID" name="teacher_id" value={formData.teacher_id} onChange={handleInputChange} leftIcon={<Shield className="h-5 w-5" />} required />
                    <Input label="Primary Subjects" name="subjects" value={formData.subjects} onChange={handleInputChange} placeholder="Math, Physics..." leftIcon={<BookOpen className="h-5 w-5" />} required />
                    
                    <div className="md:col-span-2 space-y-4 pt-6 border-t border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-black text-text-primary">Teaching Assignments</h3>
                          <p className="text-xs text-text-tertiary">Select subjects and classes you teach for Result Management.</p>
                        </div>
                      </div>
                      
                      {assignments.map((assignment, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end bg-bg-tertiary/20 p-4 rounded-xl border border-border/30">
                          <Input 
                            label="Subject Name" 
                            name={`subject_${index}`}
                            value={assignment.subject_name} 
                            onChange={(e) => {
                              const newAssigns = [...assignments];
                              newAssigns[index].subject_name = e.target.value;
                              setAssignments(newAssigns);
                            }}
                            placeholder="e.g. Mathematics" 
                            required
                          />
                          <Select 
                            label="Class Taught" 
                            name={`class_${index}`}
                            value={assignment.class_id}
                            onChange={(e) => {
                              const newAssigns = [...assignments];
                              newAssigns[index].class_id = e.target.value;
                              setAssignments(newAssigns);
                            }}
                            options={[{ value: '', label: 'Select Class' }, ...classes.map(c => ({ value: c.id, label: `${c.name} - ${c.section}` }))]}
                            required
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setAssignments(assignments.filter((_, i) => i !== index))}
                            className="text-danger border-danger/20 hover:bg-danger/10 mb-1"
                            disabled={assignments.length === 1}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setAssignments([...assignments, { subject_name: '', class_id: '' }])}
                        className="text-accent hover:bg-accent/10"
                      >
                        + Add Another Subject/Class
                      </Button>
                    </div>

                    <div className="md:col-span-2 p-6 mt-6 rounded-3xl bg-bg-tertiary/50 border border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-accent" />
                        <div>
                          <p className="font-bold text-text-primary text-sm">Class Teacher Status</p>
                          <p className="text-[10px] text-text-tertiary">Are you responsible for a specific class?</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="is_class_teacher"
                          value="true"
                          className="sr-only peer"
                          checked={formData.is_class_teacher}
                          onChange={handleInputChange}
                        />
                        <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>

                    {formData.is_class_teacher && (
                      <div className="md:col-span-2 animate-in zoom-in-95 duration-200">
                        <Select 
                          label="Assigned Responsibility Class" 
                          name="class_id"
                          value={formData.class_id}
                          onChange={handleInputChange}
                          options={[{ value: '', label: 'Select Class' }, ...classes.map(c => ({ value: c.id, label: `${c.name} - ${c.section}` }))]}
                          required
                        />
                      </div>
                    )}
                    
                    <Input label="Professional Qualification" name="qualification" value={formData.qualification} onChange={handleInputChange} leftIcon={<GraduationCap className="h-5 w-5" />} />
                    <Input label="Teaching Experience (Years)" name="experience" type="number" value={formData.experience} onChange={handleInputChange} leftIcon={<Clock className="h-5 w-5" />} />
                    <div className="md:col-span-2">
                      <Input label="Full Address" name="address" value={formData.address} onChange={handleInputChange} leftIcon={<MapPin className="h-5 w-5" />} />
                    </div>
                  </div>
                )}

                {(role === 'admin' || role === 'super_admin') && (
                  <div className="grid grid-cols-1 gap-8">
                    <Input 
                      label="School Official Address" 
                      name="school_address"
                      value={formData.school_address}
                      onChange={handleInputChange}
                      placeholder="School street, city, postal code"
                      leftIcon={<MapPin className="h-5 w-5" />}
                      required
                    />
                    <Input 
                      label="Personal / Home Address" 
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Your home address"
                      leftIcon={<User className="h-5 w-5" />}
                    />
                    <div className="p-8 rounded-3xl bg-accent-subtle/30 border border-accent/10 text-center">
                       <Shield className="h-10 w-10 text-accent mx-auto mb-4" />
                       <h3 className="font-black text-text-primary mb-2">Administrative Verification</h3>
                       <p className="text-xs text-text-tertiary leading-relaxed">
                         Your account is flagged as an administrative role. All changes to school metadata will be logged and audited for security purposes.
                       </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-10 border-t border-border mt-10">
              {step > 1 ? (
                <Button variant="ghost" onClick={handleBack} className="gap-2 h-12 px-6 font-bold hover:bg-bg-tertiary transition-colors">
                  <ArrowLeft className="h-5 w-5" /> Back
                </Button>
              ) : <div />}

              {step < totalSteps ? (
                <Button onClick={handleNext} className="btn-primary gap-2 h-12 px-10 rounded-2xl shadow-xl shadow-accent/20 font-black">
                  Next Step <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  isLoading={isSaving}
                  className="btn-primary gap-2 h-12 px-12 rounded-2xl shadow-xl shadow-accent/20 font-black"
                >
                  <CheckCircle className="h-5 w-5" /> {profile?.full_name ? 'Update Everything' : 'Finalize Profile'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
