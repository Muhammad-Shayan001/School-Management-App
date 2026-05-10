'use client';

import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { Settings, Shield, Bell, Palette } from 'lucide-react';

export default function SuperAdminSettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          System configuration and preferences
        </p>
      </div>

      {/* Settings sections */}
      <div className="space-y-5">
        {/* Profile */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-lg bg-accent-subtle flex items-center justify-center">
              <Settings className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Profile</h2>
              <p className="text-xs text-text-secondary">Your account information</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              defaultValue={user?.full_name || ''}
              placeholder="Your name"
            />
            <Input
              label="Email"
              defaultValue={user?.email || ''}
              disabled
              placeholder="Email"
            />
            <Input
              label="Phone"
              defaultValue={user?.phone || ''}
              placeholder="Phone number"
            />
          </div>
          <div className="mt-5 flex justify-end">
            <Button size="sm">Save Changes</Button>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-lg bg-warning-subtle flex items-center justify-center">
              <Shield className="h-4 w-4 text-warning" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Security</h2>
              <p className="text-xs text-text-secondary">Password and authentication</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
            />
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
            />
          </div>
          <div className="mt-5 flex justify-end">
            <Button size="sm" variant="secondary">Update Password</Button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-lg bg-info-subtle flex items-center justify-center">
              <Bell className="h-4 w-4 text-info" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Notifications</h2>
              <p className="text-xs text-text-secondary">Manage notification preferences</p>
            </div>
          </div>
          <div className="space-y-3">
            {['New registrations', 'System alerts', 'Email notifications'].map((item) => (
              <label
                key={item}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary hover:bg-bg-elevated transition-colors cursor-pointer"
              >
                <span className="text-sm text-text-primary">{item}</span>
                <div className="relative">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-bg-elevated rounded-full peer-checked:bg-accent transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-text-tertiary rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-all" />
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
