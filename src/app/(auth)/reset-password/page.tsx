'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@/app/_lib/actions/auth';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const result = await updatePassword(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    
    setIsLoading(false);
  }

  if (success) {
    return (
      <div className="text-center animate-slide-in-up">
        <CheckCircle className="mx-auto h-12 w-12 text-success mb-4" />
        <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
          Password Reset Successfully
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Your password has been successfully updated. You can now use your new password to log in.
        </p>
        <Link href="/login" className="w-full">
          <Button className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Continue to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Set New Password
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Please enter your new password below
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-danger-subtle border border-danger/20 text-sm text-danger animate-slide-in-up">
          {error}
        </div>
      )}

      {/* Reset Password Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          name="password"
          type="password"
          label="New Password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          hint="Must be at least 6 characters"
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Input
          name="confirm_password"
          type="password"
          label="Confirm New Password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Update Password
        </Button>
      </form>
    </>
  );
}
