import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/_lib/actions/auth';
import { DASHBOARD_ROUTES } from '@/app/_lib/utils/constants';
import type { UserRole } from '@/app/_lib/utils/constants';
import { ArrowRight, BookOpen, Shield, Users, Zap } from 'lucide-react';

/**
 * Landing page — redirects authenticated users to their dashboard.
 * Shows a branded hero page for unauthenticated visitors.
 */
export default async function HomePage() {
  const user = await getCurrentUser();

  // Redirect authenticated users to their dashboard
  if (user && user.status === 'approved') {
    redirect(DASHBOARD_ROUTES[user.role as UserRole]);
  }

  return (
    <div className="auth-background min-h-screen flex flex-col relative">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">
            SchoolMS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
        <div className="animate-slide-in-up max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-subtle border border-accent/20 text-accent text-xs font-medium mb-8">
            <Zap className="h-3.5 w-3.5" />
            Modern School Management Platform
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1] mb-6">
            Manage Your School{' '}
            <span className="gradient-text">Effortlessly</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            A complete school management solution with role-based dashboards,
            real-time communication, attendance tracking, and academic
            management — all in one beautiful platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-accent/20"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-medium text-text-primary border border-border hover:border-border-hover hover:bg-glass-hover rounded-xl transition-all duration-200"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl w-full stagger-children">
          <div className="glass-card p-5 text-left glass-card-hover">
            <div className="h-10 w-10 rounded-lg bg-accent-subtle flex items-center justify-center mb-3">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1.5">
              Role-Based Access
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Super Admin, Admin, Teacher, and Student dashboards with
              approval workflows.
            </p>
          </div>
          <div className="glass-card p-5 text-left glass-card-hover">
            <div className="h-10 w-10 rounded-lg bg-success-subtle flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-success" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1.5">
              Real-Time Chat
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Instant messaging between admins, teachers, and students with
              live updates.
            </p>
          </div>
          <div className="glass-card p-5 text-left glass-card-hover">
            <div className="h-10 w-10 rounded-lg bg-warning-subtle flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5 text-warning" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1.5">
              Academic Tools
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Timetables, assignments, attendance, results, and announcements
              — all integrated.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs text-text-tertiary">
        © {new Date().getFullYear()} SchoolMS. Built for modern education.
      </footer>
    </div>
  );
}
