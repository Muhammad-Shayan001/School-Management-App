'use client';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { Settings, Shield } from 'lucide-react';

export default function TeacherSettingsPage() {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-text-primary tracking-tight">Settings</h1><p className="mt-1 text-sm text-text-secondary">Account preferences</p></div>
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5"><div className="h-9 w-9 rounded-lg bg-accent-subtle flex items-center justify-center"><Settings className="h-4 w-4 text-accent"/></div><h2 className="text-base font-semibold text-text-primary">Profile</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input label="Full Name" defaultValue={user?.full_name||''}/><Input label="Email" defaultValue={user?.email||''} disabled/><Input label="Phone" defaultValue={user?.phone||''}/></div>
        <div className="mt-5 flex justify-end"><Button size="sm">Save</Button></div>
      </div>
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5"><div className="h-9 w-9 rounded-lg bg-warning-subtle flex items-center justify-center"><Shield className="h-4 w-4 text-warning"/></div><h2 className="text-base font-semibold text-text-primary">Security</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input label="Current Password" type="password" placeholder="••••••••"/><Input label="New Password" type="password" placeholder="••••••••"/></div>
        <div className="mt-5 flex justify-end"><Button size="sm" variant="secondary">Update Password</Button></div>
      </div>
    </div>
  );
}
