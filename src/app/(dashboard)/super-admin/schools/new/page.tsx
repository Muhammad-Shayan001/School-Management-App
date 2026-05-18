'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Select } from '@/app/_components/ui/select';
import { Card, CardHeader, CardBody } from '@/app/_components/ui/card';
import {
  Building2,
  MapPin,
  Phone,
  User,
  Settings,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  Palette
} from 'lucide-react';
import { createNewSchool } from '@/app/_lib/actions/schools';

export default function AddSchoolPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Branding Previews
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#4f46e5');
  const [accentColor, setAccentColor] = useState('#818cf8');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createNewSchool(formData);
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/super-admin/schools'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Add New School</h1>
          <p className="text-text-secondary mt-1 font-medium">Create a new institution and configure its initial settings.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-danger mt-0.5 shrink-0" />
          <p className="text-sm font-bold text-danger">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
          <p className="text-sm font-bold text-success">School created successfully! Redirecting...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Information */}
        <Card className="border-border/50 shadow-sm overflow-hidden" padding="none">
          <div className="h-2 w-full gradient-bg" />
          <div className="bg-bg-secondary/50 border-b border-border/50 p-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <p className="text-sm text-text-secondary">Core details about the institution.</p>
              </div>
            </div>
          </div>
          <CardBody className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input name="name" label="School Name" placeholder="e.g. Lincoln High School" required />
            <Input name="short_name" label="Short Name / Abbreviation" placeholder="e.g. LHS" />
            <Input name="campus_code" label="School Code" placeholder="e.g. LHS-001 (Auto-generated if left blank)" />
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider pl-1">School Type</label>
              <Select 
                name="school_type" 
                required 
                options={[
                  { value: "Primary School", label: "Primary School" },
                  { value: "Secondary School", label: "Secondary School" },
                  { value: "Higher Secondary School", label: "Higher Secondary School" },
                  { value: "College", label: "College" },
                  { value: "Academy", label: "Academy" },
                  { value: "University", label: "University" },
                  { value: "Other", label: "Other" }
                ]} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider pl-1">Education Board</label>
              <Select 
                name="education_board" 
                options={[
                  { value: "Federal Board", label: "Federal Board" },
                  { value: "Sindh Board", label: "Sindh Board" },
                  { value: "Punjab Board", label: "Punjab Board" },
                  { value: "Cambridge", label: "Cambridge" },
                  { value: "Other", label: "Other" }
                ]} 
              />
            </div>

            <Input name="established_year" type="number" label="Established Year" placeholder="e.g. 1995" />
            <Input name="registration_number" label="Registration Number" placeholder="Official Reg. No" />
            <Input name="ntn_number" label="NTN / Tax Number" placeholder="Optional" />
            
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider pl-1">School Motto</label>
              <Input name="school_motto" placeholder="e.g. Excellence in Education" />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider pl-1">Description</label>
              <textarea 
                name="description" 
                rows={3} 
                className="w-full px-4 py-2.5 rounded-xl border border-border/50 bg-bg-secondary/50 focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-sm outline-none resize-none"
                placeholder="Brief description about the school..."
              />
            </div>
          </CardBody>
        </Card>

        {/* Section 2: Branding */}
        <Card className="border-border/50 shadow-sm overflow-hidden" padding="none">
          <div className="h-2 w-full bg-gradient-to-r from-pink-500 to-rose-500" />
          <div className="bg-bg-secondary/50 border-b border-border/50 p-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Palette className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">School Branding</h3>
                <p className="text-sm text-text-secondary">Logo, banners, and theme colors.</p>
              </div>
            </div>
          </div>
          <CardBody className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-4">
              <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider pl-1">School Logo</label>
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-border/60 flex items-center justify-center bg-bg-tertiary overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-text-tertiary opacity-50" />
                  )}
                </div>
                <div className="space-y-2">
                  <Input name="logo_file" type="file" accept="image/*" onChange={handleLogoChange} className="max-w-[250px]" />
                  <p className="text-[10px] text-text-tertiary">Recommended: 256x256px (PNG, JPG, WEBP)</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider pl-1">Theme Colors</label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-text-tertiary uppercase text-center">Primary</p>
                  <input type="color" name="primary_color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-full h-10 rounded cursor-pointer border-0 p-0" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-text-tertiary uppercase text-center">Secondary</p>
                  <input type="color" name="secondary_color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-full h-10 rounded cursor-pointer border-0 p-0" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-text-tertiary uppercase text-center">Accent</p>
                  <input type="color" name="accent_color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-full h-10 rounded cursor-pointer border-0 p-0" />
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-2 pt-4 border-t border-border/50">
              <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider pl-1">School Banner URL</label>
              <Input name="banner_url" placeholder="https://..." leftIcon={<ImageIcon className="h-4 w-4" />} />
            </div>

          </CardBody>
        </Card>

        {/* Section 3 & 4: Contact & Address */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <Card className="border-border/50 shadow-sm overflow-hidden" padding="none">
            <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-cyan-500" />
            <div className="bg-bg-secondary/50 border-b border-border/50 p-6 pb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Location Details</h3>
                </div>
              </div>
            </div>
            <CardBody className="p-6 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <Input name="country" label="Country" placeholder="e.g. Pakistan" />
                 <Input name="province" label="Province/State" placeholder="e.g. Punjab" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <Input name="city" label="City" placeholder="e.g. Lahore" />
                 <Input name="postal_code" label="Postal Code" placeholder="e.g. 54000" />
               </div>
               <Input name="address" label="Full Address" placeholder="Street address..." />
               <Input name="map_url" label="Google Maps URL" placeholder="https://maps.google.com/..." />
            </CardBody>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden" padding="none">
            <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="bg-bg-secondary/50 border-b border-border/50 p-6 pb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Contact Info</h3>
                </div>
              </div>
            </div>
            <CardBody className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input name="phone" label="Official Phone" placeholder="+123..." />
                <Input name="whatsapp_number" label="WhatsApp" placeholder="+123..." />
              </div>
              <Input name="email" type="email" label="Official Email" placeholder="school@example.com" />
              <Input name="website_url" label="Website URL" placeholder="https://..." />
              
              <div className="pt-2">
                <p className="text-xs font-bold text-text-tertiary mb-2 uppercase tracking-wider">Social Links</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input name="facebook_url" placeholder="Facebook URL" />
                  <Input name="instagram_url" placeholder="Instagram URL" />
                </div>
              </div>
            </CardBody>
          </Card>

        </div>

        {/* Section 5: Principal/Admin Info */}
        <Card className="border-border/50 shadow-sm overflow-hidden border-accent/20" padding="none">
          <div className="h-2 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="bg-amber-500/5 border-b border-border/50 p-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <User className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Principal / Admin Setup</h3>
                <p className="text-sm text-text-secondary">Creates the primary administrative account for this school.</p>
              </div>
            </div>
          </div>
          <CardBody className="p-6">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
              <p className="text-sm font-bold text-amber-600">
                Security Note: This will create a new Admin account. The credentials provided below will be used by the principal to log into the system.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input name="admin_name" label="Admin Full Name" placeholder="e.g. John Doe" required />
              <Input name="admin_email" type="email" label="Admin Email (Login ID)" placeholder="admin@school.com" required />
              <Input name="admin_password" type="password" label="Initial Password" placeholder="Minimum 6 characters" required />
              <Input name="admin_cnic" label="CNIC Number" placeholder="00000-0000000-0" />
              <Input name="admin_phone" label="Mobile Number" placeholder="+123..." />
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider pl-1">Gender</label>
                <Select 
                  name="admin_gender"
                  options={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" }
                  ]}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Section 7: School Settings */}
        <Card className="border-border/50 shadow-sm overflow-hidden" padding="none">
          <div className="h-2 w-full bg-gradient-to-r from-purple-500 to-indigo-500" />
          <div className="bg-bg-secondary/50 border-b border-border/50 p-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">System Settings</h3>
                <p className="text-sm text-text-secondary">Initial configuration for academic and attendance rules.</p>
              </div>
            </div>
          </div>
          <CardBody className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-4">
              <h4 className="text-sm font-black text-text-primary border-b border-border pb-2">Academic Settings</h4>
              <Input name="academic_year" label="Academic Year" defaultValue="2026-2027" />
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider pl-1">Result System</label>
                <Select 
                  name="result_system_type"
                  options={[
                    { value: "GPA", label: "GPA / Grading" },
                    { value: "Marks", label: "Total Marks" }
                  ]}
                />
              </div>
              <Input name="passing_percentage" type="number" label="Passing Percentage" defaultValue="40" />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-text-primary border-b border-border pb-2">Attendance Rules</h4>
              <Input name="late_time_limit" type="time" label="Late Mark Time" defaultValue="08:15" />
              <Input name="auto_absent_time" type="time" label="Auto Absent Time" defaultValue="09:00" />
              <div className="flex items-center gap-2 pt-2">
                 <input type="checkbox" name="qr_attendance" defaultChecked id="qr_attendance" className="rounded text-accent focus:ring-accent" />
                 <label htmlFor="qr_attendance" className="text-sm font-bold text-text-secondary">Enable QR Attendance</label>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-text-primary border-b border-border pb-2">Timetable & Fees</h4>
              <Input name="period_duration" type="number" label="Period Duration (Mins)" defaultValue="45" />
              <Input name="currency" label="Currency" defaultValue="PKR" />
              <Input name="monthly_fee" type="number" label="Default Monthly Fee" defaultValue="0" />
            </div>

          </CardBody>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-6 border-t border-border pb-12">
          <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto rounded-xl py-6 font-bold text-sm">
            Cancel
          </Button>
          <Button type="submit" size="lg" isLoading={isLoading} leftIcon={<Save className="h-5 w-5" />} className="w-full sm:w-auto rounded-xl py-6 font-black text-sm shadow-xl shadow-accent/20">
            Create School & Admin
          </Button>
        </div>

      </form>
    </div>
  );
}
