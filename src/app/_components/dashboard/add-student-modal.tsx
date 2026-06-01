'use client';

import { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, 
  CreditCard, GraduationCap, Users, 
  Camera, Check, X, Shield, Info
} from 'lucide-react';
import { Modal } from '@/app/_components/ui/modal';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { Select } from '@/app/_components/ui/select';
import { Badge } from '@/app/_components/ui/badge';
import { cn } from '@/app/_lib/utils/cn';
import { createManualStudent, updateManualStudentData } from '@/app/_lib/actions/users';
import { getAllStudentGroups } from '@/app/_lib/actions/groups';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { toast } from 'sonner';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  onSuccess: (credentials: any) => void;
  editStudent?: any | null;
}

export function AddStudentModal({ isOpen, onClose, classes, onSuccess, editStudent }: AddStudentModalProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [groupOptions, setGroupOptions] = useState<any[]>([
    { label: 'Science', value: 'Science' },
    { label: 'Commerce', value: 'Commerce' },
    { label: 'Engineering', value: 'Engineering' },
    { label: 'Other', value: 'Other' }
  ]);

  const [formData, setFormData] = useState({
    // Section 1: Student Information
    full_name: '',
    email: '',
    phone: '',
    registration_no: '',
    admission_date: new Date().toISOString().split('T')[0],
    class_id: '',
    roll_number: '',
    fee_discount: '0',
    sms_phone: '',
    avatar_url: '',
    password: '',

    // Section 2: Other Information
    dob: '',
    birth_form_id: '',
    is_orphan: 'false',
    gender: 'male',
    student_cast: '',
    is_osc: 'false',
    id_mark: '',
    previous_school: '',
    religion: 'Islam',
    blood_group: '',
    family_id: '',
    disease: '',
    additional_note: '',
    total_siblings: '0',
    address: '',
    cnic: '', // Used for Birth Form ID/NIC

    // Section 3: Father Information
    father_name: '',
    father_cnic: '',
    father_occupation: '',
    father_education: '',
    father_phone: '',
    father_profession: '',
    father_income: '',

    // Section 4: Mother Information
    mother_name: '',
    mother_cnic: '',
    mother_occupation: '',
    mother_education: '',
    mother_phone: '',
    mother_profession: '',
    mother_income: '',

    // Academic Settings (Internal)
    section: '',
    shift: 'morning',
    group: 'General',
    session_year: new Date().getFullYear().toString(),
  });

  const selectedClass = classes.find(c => c.id === formData.class_id);
  const showGroupField = selectedClass?.name === 'Class 11' || selectedClass?.name === 'Class 12';

  // Fetch dynamic groups from database
  useEffect(() => {
    if (isOpen && user?.school_id) {
      const fetchGroups = async () => {
        const { data } = await getAllStudentGroups(user.school_id!);
        if (data && data.length > 0) {
          setGroupOptions(data.map((g: any) => ({
            label: g.label || g.value,
            value: g.value
          })));
        }
      };
      fetchGroups();
    }
  }, [isOpen, user?.school_id]);

  useEffect(() => {
    if (isOpen && editStudent) {
      setFormData({
        full_name: editStudent.profiles?.full_name || '',
        email: editStudent.profiles?.email || '',
        phone: editStudent.phone || editStudent.profiles?.phone || '',
        registration_no: editStudent.registration_no || '',
        admission_date: editStudent.admission_date || new Date().toISOString().split('T')[0],
        class_id: editStudent.class_id || '',
        roll_number: editStudent.roll_number || '',
        fee_discount: editStudent.fee_discount?.toString() || '0',
        sms_phone: editStudent.sms_phone || '',
        avatar_url: editStudent.profiles?.avatar_url || '',
        password: '',
        dob: editStudent.dob || '',
        birth_form_id: editStudent.birth_form_id || '',
        is_orphan: editStudent.is_orphan ? 'true' : 'false',
        gender: editStudent.gender || 'male',
        student_cast: editStudent.student_cast || '',
        is_osc: editStudent.is_osc ? 'true' : 'false',
        id_mark: editStudent.id_mark || '',
        previous_school: editStudent.previous_school || '',
        religion: editStudent.religion || 'Islam',
        blood_group: editStudent.blood_group || '',
        family_id: editStudent.family_id || '',
        disease: editStudent.disease || '',
        additional_note: editStudent.additional_note || '',
        total_siblings: editStudent.total_siblings?.toString() || '0',
        address: editStudent.address || '',
        cnic: editStudent.cnic || '',
        father_name: editStudent.father_name || '',
        father_cnic: editStudent.father_cnic || '',
        father_occupation: editStudent.father_occupation || '',
        father_education: editStudent.father_education || '',
        father_phone: editStudent.father_phone || '',
        father_profession: editStudent.father_profession || '',
        father_income: editStudent.father_income || '',
        mother_name: editStudent.mother_name || '',
        mother_cnic: editStudent.mother_cnic || '',
        mother_occupation: editStudent.mother_occupation || '',
        mother_education: editStudent.mother_education || '',
        mother_phone: editStudent.mother_phone || '',
        mother_profession: editStudent.mother_profession || '',
        mother_income: editStudent.mother_income || '',
        section: editStudent.section || '',
        shift: editStudent.shift || 'morning',
        group: editStudent.group || 'General',
        session_year: editStudent.session_year || new Date().getFullYear().toString(),
      });
      setPreviewImage(editStudent.profiles?.avatar_url || null);
      setStep(1);
    } else if (isOpen && !editStudent) {
      setFormData({
        full_name: '', email: '', phone: '', registration_no: '', admission_date: new Date().toISOString().split('T')[0], class_id: '', roll_number: '', fee_discount: '0', sms_phone: '', avatar_url: '', password: '', dob: '', birth_form_id: '', is_orphan: 'false', gender: 'male', student_cast: '', is_osc: 'false', id_mark: '', previous_school: '', religion: 'Islam', blood_group: '', family_id: '', disease: '', additional_note: '', total_siblings: '0', address: '', cnic: '', father_name: '', father_cnic: '', father_occupation: '', father_education: '', father_phone: '', father_profession: '', father_income: '', mother_name: '', mother_cnic: '', mother_occupation: '', mother_education: '', mother_phone: '', mother_profession: '', mother_income: '', section: '', shift: 'morning', group: 'General', session_year: new Date().getFullYear().toString()
      });
      setPreviewImage(null);
      setStep(1);
    }
  }, [isOpen, editStudent]);

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

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email || !formData.class_id) {
      toast.error('Please fill in all required fields (Name, Email, Class)');
      return;
    }

    setLoading(true);
    try {
      if (editStudent) {
        const result = await updateManualStudentData(editStudent.user_id, formData);
        if (result.success) {
          toast.success('Student record updated successfully!');
          onSuccess({ updated: true, email: formData.email });
          onClose();
        } else {
          toast.error(result.error || 'Failed to update student record');
        }
      } else {
        const result = await createManualStudent(formData);
        if (result.success) {
          toast.success('Student account created successfully!');
          onSuccess(result.credentials);
          onClose();
          setStep(1);
          setPreviewImage(null);
        } else {
          toast.error(result.error || 'Failed to create student');
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
      title={editStudent ? "Edit Student Profile & Master Record" : "Advanced Student Admission"}
      size="3xl"
      className="rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl"
    >
      <div className="flex flex-col h-[85vh] bg-bg-primary overflow-hidden">
        {/* Modern Header with Stepper */}
        <div className="bg-white border-b border-border/40 p-4 md:p-10 flex-shrink-0">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
              <div className="flex items-center gap-2 sm:gap-4 md:gap-10 w-full overflow-x-auto scrollbar-hide py-2 px-1 justify-between md:justify-start">
                 {[1, 2, 3, 4].map((s) => (
                   <div key={s} className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                      <div className={cn(
                        "h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center font-black transition-all duration-500",
                        step === s ? "bg-accent text-white shadow-lg shadow-accent/20 scale-110" : 
                        step > s ? "bg-emerald-500 text-white" : "bg-bg-tertiary text-text-tertiary border border-border/40"
                      )}>
                        {step > s ? <Check className="h-4 w-4 md:h-5 md:w-5" /> : s}
                      </div>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] hidden lg:block",
                        step === s ? "text-accent" : "text-text-tertiary"
                      )}>
                        {s === 1 ? 'Student' : s === 2 ? 'Other' : s === 3 ? 'Father' : 'Mother'}
                      </span>
                   </div>
                 ))}
              </div>
              <div className="hidden md:flex items-center gap-4">
                 <Badge variant="default" className="font-black text-[9px] tracking-widest uppercase py-1.5 px-4 bg-bg-tertiary/50 border-border/40">Admission Portal</Badge>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 scrollbar-premium">
          <div className="max-w-5xl mx-auto">
            {/* Step 1: Student Information */}
            {step === 1 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                   {/* Profile Picture Slot */}
                   <div className="relative group mx-auto lg:mx-0">
                      <div className={cn(
                        "h-56 w-56 rounded-[3rem] bg-bg-tertiary border-2 border-dashed border-border/60 flex items-center justify-center overflow-hidden transition-all duration-700 group-hover:border-accent/40 relative",
                        previewImage && "border-solid border-accent/20"
                      )}>
                         {previewImage ? (
                           <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                         ) : (
                           <div className="text-center space-y-4">
                              <Camera className="h-10 w-10 text-text-tertiary/30 mx-auto" />
                              <p className="text-[10px] font-black text-text-tertiary/60 uppercase tracking-widest">Select Image</p>
                           </div>
                         )}
                         <input 
                           type="file" 
                           accept="image/*" 
                           onChange={handleImageChange}
                           className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                         />
                      </div>
                      {previewImage && (
                        <button 
                          onClick={() => setPreviewImage(null)}
                          className="absolute -top-3 -right-3 h-10 w-10 rounded-2xl bg-white shadow-2xl border border-border/20 flex items-center justify-center text-danger hover:scale-110 transition-transform z-20"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                   </div>

                   <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                      <div className="col-span-1 md:col-span-2">
                        <Input 
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          label="Student Full Name *"
                          placeholder="Legal name as on documents"
                          className="h-14 bg-bg-tertiary/30 border-transparent focus:bg-white"
                        />
                      </div>
                      <Select 
                        label="Select Class *"
                        value={formData.class_id}
                        onChange={(e) => {
                          const classId = e.target.value;
                          const cls = classes.find(c => c.id === classId);
                          const isHighSchool = cls?.name === 'Class 11' || cls?.name === 'Class 12';
                          setFormData(prev => ({
                            ...prev,
                            class_id: classId,
                            group: isHighSchool ? (prev.group === 'General' ? 'Science' : prev.group) : 'General'
                          }));
                        }}
                        options={[
                          { label: 'Choose Classroom', value: '' },
                          ...classes.map(c => ({ label: `${c.name}${c.section && c.section.toUpperCase() !== 'A' ? ` - ${c.section}` : ''}`, value: c.id }))
                        ]}
                        className="h-14 bg-bg-tertiary/30"
                      />
                      {showGroupField && (
                        <Select 
                          label="Select Group *"
                          value={formData.group}
                          onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value }))}
                          options={groupOptions}
                          className="h-14 bg-bg-tertiary/30"
                        />
                      )}
                      <Input 
                        name="admission_date"
                        value={formData.admission_date}
                        onChange={handleChange}
                        type="date"
                        label="Date of Admission *"
                        className="h-14 bg-bg-tertiary/30"
                      />
                      <Input 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        label="Official Email *"
                        placeholder="e.g. shayan@school.edu"
                        className="h-14 bg-bg-tertiary/30"
                      />
                      <Input 
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        type="text"
                        label="Account Password"
                        placeholder="Auto-generated if left blank"
                        className="h-14 bg-bg-tertiary/30 font-mono"
                      />
                      <Input 
                        name="registration_no"
                        value={formData.registration_no}
                        onChange={handleChange}
                        label="Registration No"
                        placeholder="Manual or auto-id"
                        className="h-14 bg-bg-tertiary/30"
                      />
                      <Input 
                        name="fee_discount"
                        value={formData.fee_discount}
                        onChange={handleChange}
                        label="Discount in Fee (%)"
                        placeholder="0.00"
                        className="h-14 bg-bg-tertiary/30"
                      />
                      <Input 
                        name="sms_phone"
                        value={formData.sms_phone}
                        onChange={handleChange}
                        label="Mobile for SMS/WhatsApp"
                        placeholder="+92 3XX XXXXXXX"
                        className="h-14 bg-bg-tertiary/30"
                      />
                   </div>
                </div>
              </div>
            )}

            {/* Step 2: Other Information */}
            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <Input 
                     name="dob"
                     value={formData.dob}
                     onChange={handleChange}
                     type="date"
                     label="Date of Birth"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="cnic"
                     value={formData.cnic}
                     onChange={handleChange}
                     label="Birth Form ID / NIC"
                     placeholder="XXXXX-XXXXXXX-X"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Select 
                     label="Orphan Student?"
                     value={formData.is_orphan}
                     onChange={(e) => setFormData(prev => ({ ...prev, is_orphan: e.target.value }))}
                     options={[
                       { label: 'No', value: 'false' },
                       { label: 'Yes', value: 'true' }
                     ]}
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Select 
                     label="Gender"
                     value={formData.gender}
                     onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                     options={[
                       { label: 'Male', value: 'male' },
                       { label: 'Female', value: 'female' },
                       { label: 'Other', value: 'other' }
                     ]}
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="student_cast"
                     value={formData.student_cast}
                     onChange={handleChange}
                     label="Cast"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Select 
                     label="OSC Student?"
                     value={formData.is_osc}
                     onChange={(e) => setFormData(prev => ({ ...prev, is_osc: e.target.value }))}
                     options={[
                       { label: 'No', value: 'false' },
                       { label: 'Yes', value: 'true' }
                     ]}
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="id_mark"
                     value={formData.id_mark}
                     onChange={handleChange}
                     label="Identification Mark"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="previous_school"
                     value={formData.previous_school}
                     onChange={handleChange}
                     label="Previous School"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Select 
                     label="Religion"
                     value={formData.religion}
                     onChange={(e) => setFormData(prev => ({ ...prev, religion: e.target.value }))}
                     options={[
                       { label: 'Islam', value: 'Islam' },
                       { label: 'Christianity', value: 'Christianity' },
                       { label: 'Hinduism', value: 'Hinduism' },
                       { label: 'Others', value: 'Others' }
                     ]}
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="blood_group"
                     value={formData.blood_group}
                     onChange={handleChange}
                     label="Blood Group"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="family_id"
                     value={formData.family_id}
                     onChange={handleChange}
                     label="Family ID / Name"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="total_siblings"
                     value={formData.total_siblings}
                     onChange={handleChange}
                     type="number"
                     label="Total Siblings"
                     className="h-14 bg-bg-tertiary/30"
                   />
                </div>
                <Input 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  label="Residential Address"
                  placeholder="Full street address, city, state..."
                  className="h-14 bg-bg-tertiary/30"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <Input 
                     name="disease"
                     value={formData.disease}
                     onChange={handleChange}
                     label="Medical Conditions / Disease"
                     placeholder="None"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="additional_note"
                     value={formData.additional_note}
                     onChange={handleChange}
                     label="Additional Administrative Note"
                     placeholder="..."
                     className="h-14 bg-bg-tertiary/30"
                   />
                </div>
              </div>
            )}

            {/* Step 3: Father Information */}
            {step === 3 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <Input 
                     name="father_name"
                     value={formData.father_name}
                     onChange={handleChange}
                     label="Father's Full Name"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="father_cnic"
                     value={formData.father_cnic}
                     onChange={handleChange}
                     label="Father's National ID (CNIC)"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="father_occupation"
                     value={formData.father_occupation}
                     onChange={handleChange}
                     label="Occupation"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="father_education"
                     value={formData.father_education}
                     onChange={handleChange}
                     label="Education"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="father_phone"
                     value={formData.father_phone}
                     onChange={handleChange}
                     label="Mobile Number"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="father_profession"
                     value={formData.father_profession}
                     onChange={handleChange}
                     label="Profession"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="father_income"
                     value={formData.father_income}
                     onChange={handleChange}
                     label="Monthly Income"
                     className="h-14 bg-bg-tertiary/30"
                   />
                </div>
              </div>
            )}

            {/* Step 4: Mother Information */}
            {step === 4 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <Input 
                     name="mother_name"
                     value={formData.mother_name}
                     onChange={handleChange}
                     label="Mother's Full Name"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="mother_cnic"
                     value={formData.mother_cnic}
                     onChange={handleChange}
                     label="Mother's National ID (CNIC)"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="mother_occupation"
                     value={formData.mother_occupation}
                     onChange={handleChange}
                     label="Occupation"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="mother_education"
                     value={formData.mother_education}
                     onChange={handleChange}
                     label="Education"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="mother_phone"
                     value={formData.mother_phone}
                     onChange={handleChange}
                     label="Mobile Number"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="mother_profession"
                     value={formData.mother_profession}
                     onChange={handleChange}
                     label="Profession"
                     className="h-14 bg-bg-tertiary/30"
                   />
                   <Input 
                     name="mother_income"
                     value={formData.mother_income}
                     onChange={handleChange}
                     label="Monthly Income"
                     className="h-14 bg-bg-tertiary/30"
                   />
                </div>

                <div className="p-8 rounded-[2.5rem] bg-accent/5 border border-accent/10 flex gap-6 items-start">
                   <Shield className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                   <div className="space-y-2">
                      <p className="text-[12px] font-black text-text-primary uppercase tracking-widest">Enrollment Security Verification</p>
                      <p className="text-[11px] font-bold text-text-tertiary leading-relaxed">By creating this account, you confirm that the provided information is legally valid. The system will automatically generate credentials and link all institutional modules.</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-white border-t border-border/40 p-4 md:p-8 flex flex-col-reverse sm:flex-row justify-between items-center flex-shrink-0 gap-3">
           <Button 
             variant="outline" 
             onClick={() => step > 1 ? setStep(step - 1) : onClose()} 
             className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-bg-tertiary/50 whitespace-nowrap"
           >
             {step === 1 ? 'Cancel' : 'Previous'}
           </Button>
           
           {step < 4 ? (
             <Button 
                onClick={() => setStep(step + 1)} 
                className="w-full sm:w-auto bg-accent text-white hover:bg-accent/90 h-12 md:h-14 px-8 md:px-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-accent/20 whitespace-nowrap"
              >
                Next Step
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-accent/20 bg-accent hover:bg-accent-hover active:scale-95 transition-all text-white whitespace-nowrap"
             >
               {loading ? 'Processing...' : editStudent ? 'Save Changes' : 'Finalize'}
             </Button>
           )}
        </div>
      </div>
    </Modal>
  );
}
