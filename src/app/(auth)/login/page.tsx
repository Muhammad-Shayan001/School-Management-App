'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { login } from '@/app/_lib/actions/auth';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Mail, Lock, LogIn, School, Info, Eye, EyeOff } from 'lucide-react';

// Inner component — uses useSearchParams which requires a Suspense boundary
function LoginContent() {
  const searchParams = useSearchParams();

  // Pre-filled credentials from admin-shared portal link
  const prefillEmail  = searchParams.get('email')    || '';
  const prefillPass   = searchParams.get('password') || '';
  const hasSharedCreds = !!(prefillEmail && prefillPass);

  const [emailValue,    setEmailValue]    = useState(prefillEmail);
  const [passwordValue, setPasswordValue] = useState(prefillPass);
  const [showPassword,  setShowPassword]  = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [isLoading,     setIsLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    // Ensure pre-filled values reach the server action even if controlled inputs
    // somehow miss FormData (edge-case with some browsers)
    if (!formData.get('email')    && emailValue)    formData.set('email',    emailValue);
    if (!formData.get('password') && passwordValue) formData.set('password', passwordValue);

    try {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    } catch {
      // Next.js redirect() throws intentionally — ignore
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-top duration-700">
        <div className="h-20 w-20 rounded-[2rem] bg-bg-tertiary flex items-center justify-center mb-6 shadow-2xl shadow-black/[0.05] overflow-hidden border border-white relative group">
          <School className="h-10 w-10 text-accent" />
          <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase">Portal Access</h1>
        <p className="mt-2 text-sm font-bold text-text-tertiary uppercase tracking-widest opacity-60">
          Enter your institutional credentials to continue
        </p>
      </div>

      {/* ── Shared-link banner ─────────────────────────────── */}
      {hasSharedCreds && (
        <div className="mb-6 p-4 rounded-2xl bg-accent/10 border border-accent/30 flex items-start gap-3 animate-in fade-in">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-black text-accent">Credentials sent by your school admin</p>
            <p className="text-xs text-text-secondary font-medium">
              Your login details have been pre-filled. Just click <strong>Sign In</strong>.
            </p>
            <div className="mt-2 px-3 py-2 rounded-xl bg-white/60 border border-accent/20 flex flex-col gap-1">
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Email</p>
              <p className="text-sm font-bold text-text-primary break-all">{emailValue}</p>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mt-1">Password</p>
              <p className="text-base font-black text-accent font-mono tracking-[0.18em]">{passwordValue}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-danger-subtle border border-danger/20 text-sm text-danger animate-slide-in-up">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          name="email"
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          required
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          value={emailValue}
          onChange={e => setEmailValue(e.target.value)}
        />

        <div className="space-y-1">
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              leftIcon={<Lock className="h-4 w-4" />}
              value={passwordValue}
              onChange={e => setPasswordValue(e.target.value)}
            />
            {/* Show / hide toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-4 top-[38px] text-text-tertiary hover:text-accent transition-colors"
              tabIndex={-1}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex justify-end mt-1">
            <Link href="/forgot-password" className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading} leftIcon={<LogIn className="h-4 w-4" />}>
          Sign In
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-accent hover:text-accent-hover transition-colors">
            Create Account
          </Link>
        </p>
      </div>
    </>
  );
}

// Outer page — wraps LoginContent in Suspense (required by Next.js for useSearchParams)
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center text-center mb-10">
        <div className="h-20 w-20 rounded-[2rem] bg-bg-tertiary flex items-center justify-center mb-6 border border-white">
          <School className="h-10 w-10 text-accent" />
        </div>
        <p className="text-sm font-bold text-text-tertiary uppercase tracking-widest opacity-60">Loading…</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
