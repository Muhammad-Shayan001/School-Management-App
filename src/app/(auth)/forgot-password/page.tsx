'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/_lib/actions/auth';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

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
      <div className="text-center animate-slide-in-up p-8">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-success/20 blur-xl rounded-full" />
            <CheckCircle className="h-16 w-16 text-success relative" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight mb-2 uppercase">
          Check Your Email
        </h1>
        <p className="text-sm text-text-secondary mb-4">
          We've sent a password reset link to:
        </p>
        <p className="text-sm font-bold text-text-primary mb-6 break-all">
          {email}
        </p>
        <div className="bg-bg-secondary/50 rounded-lg p-4 mb-6 border border-border/30">
          <p className="text-xs text-text-tertiary leading-relaxed">
            The reset link expires in <strong>1 hour</strong>. If you don't see the email, check your spam folder. If you didn't request this, you can safely ignore it.
          </p>
        </div>
        <Link href="/login" className="w-full">
          <Button className="w-full h-12 rounded-xl font-bold">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-top duration-700">
        <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 border border-accent/30">
          <Mail className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">
          Forgot Password?
        </h1>
        <p className="mt-2 text-sm font-medium text-text-secondary">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-danger-subtle border border-danger/30 text-sm text-danger animate-slide-in-up flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          name="email"
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <Button
          type="submit"
          className="w-full h-12 rounded-xl font-bold"
          isLoading={isLoading}
          disabled={!email || isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      {/* Info box */}
      <div className="mt-6 p-4 rounded-lg bg-info-subtle border border-info/30">
        <p className="text-xs text-text-tertiary leading-relaxed">
          <strong>Secure Process:</strong> We'll send you a secure reset link via email. Click it to create a new password. Never share this link with anyone.
        </p>
      </div>

      {/* Footer link */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to login
        </Link>
      </div>
    </>
  );
}
