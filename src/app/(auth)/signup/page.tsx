'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signup } from '@/app/_lib/actions/auth';
import { getPublicSchools, getPublicClasses } from '@/app/_lib/actions/schools';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Select } from '@/app/_components/ui/select';
import { ROLES } from '@/app/_lib/utils/constants';
import { Mail, Lock, User, Phone, School, UserPlus, BookOpen } from 'lucide-react';

const roleOptions = [
  { value: ROLES.ADMIN, label: 'Admin (Principal)' },
  { value: ROLES.TEACHER, label: 'Teacher' },
  { value: ROLES.STUDENT, label: 'Student' },
];

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [schools, setSchools] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');

  useEffect(() => {
    async function loadSchools() {
      const { data } = await getPublicSchools();
      if (data) setSchools(data);
    }
    loadSchools();
  }, []);

  useEffect(() => {
    async function loadClasses() {
      if (selectedSchool && selectedRole === ROLES.STUDENT) {
        const { data } = await getPublicClasses(selectedSchool);
        if (data) setClasses(data);
      } else {
        setClasses([]);
      }
    }
    loadClasses();
  }, [selectedSchool, selectedRole]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    // ensure selected school is sent
    if (selectedSchool) {
      formData.set('school_id', selectedSchool);
    }

    try {
      const result = await signup(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // redirect throws in Next.js — expected
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Create Account
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Join SchoolMS and get started
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-danger-subtle border border-danger/20 text-sm text-danger animate-slide-in-up">
          {error}
        </div>
      )}

      {/* Info banner */}
      <div className="mb-6 p-3 rounded-lg bg-info-subtle border border-info/20 text-sm text-info">
        <strong>Note:</strong> Your account will require approval before you can access the dashboard.
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="full_name"
          type="text"
          label="Full Name"
          placeholder="John Doe"
          required
          leftIcon={<User className="h-4 w-4" />}
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

        <Input
          name="phone"
          type="tel"
          label="Phone Number"
          placeholder="+1 (555) 000-0000"
          leftIcon={<Phone className="h-4 w-4" />}
        />

        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="Minimum 6 characters"
          required
          autoComplete="new-password"
          hint="Must be at least 6 characters"
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Select
          name="role"
          label="Register As"
          placeholder="Select your role"
          required
          options={roleOptions}
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(e.target.value);
            setSelectedSchool('');
          }}
        />

        {/* Dynamic Fields based on Role */}
        <div className="animate-slide-in-up space-y-4">
          {selectedRole === ROLES.ADMIN && (
            <Input
              name="school_name"
              type="text"
              label="New School Name"
              placeholder="Springfield High School"
              required
              leftIcon={<School className="h-4 w-4" />}
            />
          )}

          {(selectedRole === ROLES.TEACHER || selectedRole === ROLES.STUDENT) && (
            <Select
              name="school_id"
              label="Select School"
              required
              options={schools.map(s => ({ value: s.id, label: s.name }))}
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              placeholder="Choose your school"
            />
          )}

          {selectedRole === ROLES.STUDENT && selectedSchool && (
            <div className="space-y-1">
              <Select
                name="class_id"
                label="Select Class"
                required
                options={classes.map(c => ({ value: c.id, label: `${c.name} ${c.section || ''}` }))}
                placeholder={classes.length === 0 ? "No classes available for this school" : "Choose your class"}
                disabled={classes.length === 0}
              />
              {classes.length === 0 && (
                <p className="text-[11px] text-warning px-1">
                  This school hasn't set up any classes yet. Please contact the administrator.
                </p>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-6"
          size="lg"
          isLoading={isLoading}
          leftIcon={<UserPlus className="h-4 w-4" />}
        >
          Create Account
        </Button>
      </form>

      {/* Footer links */}
      <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
}
