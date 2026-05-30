'use client';

import { useState, useTransition } from 'react';
import { changePassword } from '@/app/_lib/actions/auth';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('new_password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    startTransition(async () => {
      const result = await changePassword(formData);
      if (result?.error) {
        toast.error(result.error);
        setError(result.error);
      } else {
        toast.success(result.message || 'Password updated successfully.');
        e.currentTarget.reset();
      }
    });
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-lg bg-warning-subtle flex items-center justify-center">
          <Shield className="h-4 w-4 text-warning" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">Security</h2>
          <p className="text-xs text-text-secondary">Change your account password.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-danger-subtle border border-danger/30 p-4 text-sm text-danger flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="current_password"
            type="password"
            label="Current Password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            leftIcon={<Lock className="h-4 w-4" />}
          />

          <Input
            name="new_password"
            type="password"
            label="New Password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            leftIcon={<Lock className="h-4 w-4" />}
            hint="Must be at least 6 characters"
          />

          <Input
            name="confirm_password"
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            leftIcon={<Lock className="h-4 w-4" />}
            hint="Must match your new password"
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="submit" size="sm" variant="secondary" isLoading={isPending}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}
