'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/_lib/actions/auth';
import { getPublicSchools } from '@/app/_lib/actions/schools';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Select } from '@/app/_components/ui/select';
import { Mail, ArrowLeft, CheckCircle, School } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');

  useEffect(() => {
    async function loadSchools() {
      const { data } = await getPublicSchools();
      if (data) setSchools(data);
    }
    loadSchools();
  }, []);

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

  const currentSchool = schools.find(s => s.id === selectedSchool);

  if (success) {
    return (
      <div className="text-center animate-slide-in-up p-8">
        <CheckCircle className="mx-auto h-16 w-16 text-success mb-6" />
        <h1 className="text-2xl font-black text-text-primary tracking-tight mb-2 uppercase">
          Check your email
        </h1>
        <p className="text-sm font-medium text-text-secondary mb-8">
          Your password has been successfully sent to your email address. Please check your inbox (and spam folder) to retrieve your password.
        </p>
        <Link href="/login" className="w-full">
          <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Dynamic Brand Header */}
      <div className="flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-top duration-700">
        <div className="h-16 w-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-6 shadow-xl shadow-black/[0.05] overflow-hidden border border-white">
           {currentSchool?.logo_url ? (
              <img src={currentSchool.logo_url} alt="Logo" className="h-full w-full object-cover" />
           ) : (
              <School className="h-8 w-8 text-accent" />
           )}
        </div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">
          Reset Password
        </h1>
        <p className="mt-2 text-sm font-bold text-text-tertiary uppercase tracking-widest opacity-60">
          Recover your {currentSchool?.name || 'Skolic'} account
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-danger-subtle border border-danger/20 text-sm text-danger animate-slide-in-up">
          {error}
        </div>
      )}

      {/* Forgot Password Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Select
          name="school_id"
          label="Institution"
          placeholder="Select your school"
          required
          options={schools.map(s => ({ value: s.id, label: s.name }))}
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          className="bg-white/50 border-white/30"
        />

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
          Send Password to Email
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
