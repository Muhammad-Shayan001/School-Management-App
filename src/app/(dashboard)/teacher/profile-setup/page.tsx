'use client';
import { Input } from '@/app/_components/ui/input';
import { Select } from '@/app/_components/ui/select';
import { Button } from '@/app/_components/ui/button';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { CLASS_NAMES } from '@/app/_lib/utils/constants';
import { User, Save } from 'lucide-react';

export default function TeacherProfileSetup() {
  const { user } = useAuthStore();
  const classOptions = CLASS_NAMES.map(c => ({ value: c, label: c }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-text-primary tracking-tight">Profile Setup</h1><p className="mt-1 text-sm text-text-secondary">Complete your teacher profile</p></div>
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6"><div className="h-9 w-9 rounded-lg bg-accent-subtle flex items-center justify-center"><User className="h-4 w-4 text-accent"/></div><h2 className="text-base font-semibold text-text-primary">Personal Information</h2></div>
        <form className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" defaultValue={user?.full_name||''} placeholder="Your full name" />
            <Input label="Email" defaultValue={user?.email||''} disabled />
            <Input label="Phone" defaultValue={user?.phone||''} placeholder="Phone number" />
          </div>
          <div className="border-t border-glass-border pt-5 mt-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Teaching Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Are you a Class Teacher?" options={[{value:'no',label:'No'},{value:'yes',label:'Yes'}]} />
              <Select label="Class (if class teacher)" options={classOptions} placeholder="Select class" />
              <Input label="Subjects Taught" placeholder="e.g. Mathematics, Science" hint="Comma separated" />
            </div>
          </div>
          <div className="flex justify-end pt-2"><Button leftIcon={<Save className="h-4 w-4"/>}>Save Profile</Button></div>
        </form>
      </div>
    </div>
  );
}
