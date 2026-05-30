'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordWithToken, validateResetToken } from '@/app/_lib/actions/auth';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Lock, ArrowRight, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No reset token provided. Please use the link from your email.');
        setIsValidating(false);
        return;
      }

      const result = await validateResetToken(token);
      if (result.valid) {
        setTokenValid(true);
        setEmail(result.email || '');
      } else {
        setError(result.error || 'Invalid reset token.');
      }
      setIsValidating(false);
    }

    validateToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const password = new FormData(e.currentTarget).get('password') as string;
    const confirmPassword = new FormData(e.currentTarget).get('confirm_password') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('token', token as string);
    formData.append('password', password);

    const result = await resetPasswordWithToken(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }

    setIsLoading(false);
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="text-center animate-fade-in p-8">
        <div className="flex justify-center mb-6">
          <Loader className="h-12 w-12 text-accent animate-spin" />
        </div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight mb-2">
          Verifying Link
        </h1>
        <p className="text-sm text-text-secondary">
          Please wait while we verify your reset link...
        </p>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid && !success) {
    return (
      <div className="text-center animate-slide-in-up p-8">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-danger" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight mb-2">
          Invalid Link
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {error || 'This password reset link is invalid or has expired.'}
        </p>
        <div className="space-y-3">
          <Link href="/forgot-password" className="w-full block">
            <Button className="w-full" variant="primary">
              Request New Link
            </Button>
          </Link>
          <Link href="/login" className="w-full block">
            <Button className="w-full" variant="outline">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="text-center animate-slide-in-up p-8">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-success/20 blur-xl rounded-full" />
            <CheckCircle className="h-16 w-16 text-success relative" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight mb-2">
          Password Reset Successfully
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Your password has been updated. You can now log in with your new password.
        </p>
        <Link href="/login" className="w-full">
          <Button
            className="w-full h-12 rounded-xl font-bold"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Continue to Login
          </Button>
        </Link>
      </div>
    );
  }

  // Reset form
  return (
    <>
      {/* Header */}
      <div className="text-center mb-10 animate-in fade-in slide-in-from-top duration-700">
        <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 mx-auto border border-accent/30">
          <Lock className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">
          Create New Password
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Enter a new secure password for your account.
        </p>
        {email && (
          <p className="mt-3 text-xs text-text-tertiary">
            Resetting password for: <strong>{email}</strong>
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-danger-subtle border border-danger/30 text-sm text-danger animate-slide-in-up flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
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
          leftIcon={<Lock className="h-4 w-4" />}
          hint="Must be at least 6 characters"
        />

        <Input
          name="confirm_password"
          type="password"
          label="Confirm New Password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          leftIcon={<Lock className="h-4 w-4" />}
          hint="Must match your new password"
        />

        <Button
          type="submit"
          className="w-full h-12 rounded-xl font-bold"
          isLoading={isLoading}
          disabled={isLoading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          {isLoading ? 'Resetting Password...' : 'Reset Password'}
        </Button>
      </form>

      {/* Security info */}
      <div className="mt-6 p-4 rounded-lg bg-info-subtle border border-info/30">
        <p className="text-xs text-text-tertiary leading-relaxed">
          <strong>Security Tip:</strong> Use a strong password that includes uppercase, lowercase, numbers, and special characters.
        </p>
      </div>

      {/* Footer link */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Remember your password? Login here
        </Link>
      </div>
    </>
  );
}
