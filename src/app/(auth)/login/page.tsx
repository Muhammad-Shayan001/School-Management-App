'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/app/_lib/actions/auth';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // redirect throws in Next.js — this is expected behavior
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Welcome Back
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Sign in to your SchoolMS account
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-danger-subtle border border-danger/20 text-sm text-danger animate-slide-in-up">
          {error}
        </div>
      )}

      {/* Login Form */}
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

        <div className="space-y-1">
          <Input
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            leftIcon={<Lock className="h-4 w-4" />}
          />
          <div className="flex justify-end mt-1">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
          leftIcon={<LogIn className="h-4 w-4" />}
        >
          Sign In
        </Button>
      </form>

      {/* Footer links */}
      <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Create Account
          </Link>
        </p>
      </div>
    </>
  );
}
