'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/_lib/actions/auth';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);

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
          Check your email
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          We have generated a new temporary password and sent it to your email address. Please log in with this new password.
        </p>
        <Link href="/login" className="w-full">
          <Button variant="outline" className="w-full">
            Return to Login
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
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-danger-subtle border border-danger/20 text-sm text-danger animate-slide-in-up">
          {error}
        </div>
      )}

      {/* Forgot Password Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          name="email"
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          required
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Send Reset Link
        </Button>
      </form>

      {/* Footer links */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to log in
        </Link>
      </div>
    </>
  );
}
