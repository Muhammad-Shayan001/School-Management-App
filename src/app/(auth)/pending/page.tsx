import Link from 'next/link';
import { Clock, ArrowLeft, CheckCircle } from 'lucide-react';

/**
 * Pending approval page — shown to users whose accounts haven't been approved yet.
 */
export default function PendingPage() {
  return (
    <div className="text-center">
      {/* Animated icon */}
      <div className="mx-auto mb-6 relative">
        <div className="h-20 w-20 mx-auto rounded-full bg-warning-subtle flex items-center justify-center">
          <Clock className="h-10 w-10 text-warning" />
        </div>
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-accent-subtle flex items-center justify-center notification-badge">
          <CheckCircle className="h-3.5 w-3.5 text-accent" />
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-3">
        Account Pending Approval
      </h1>

      <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-sm mx-auto">
        Your account has been created successfully! It is currently under review.
        You will be notified once an administrator approves your account.
      </p>

      {/* Steps */}
      <div className="space-y-3 mb-8 text-left max-w-xs mx-auto">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-success-subtle/50">
          <div className="h-5 w-5 rounded-full bg-success flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-text-primary">Account created</p>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-warning-subtle/50">
          <div className="h-5 w-5 rounded-full bg-warning flex items-center justify-center flex-shrink-0 mt-0.5">
            <Clock className="h-3 w-3 text-white" />
          </div>
          <p className="text-sm text-text-primary">Awaiting admin approval</p>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary/50">
          <div className="h-5 w-5 rounded-full bg-bg-elevated flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-text-tertiary" />
          </div>
          <p className="text-sm text-text-tertiary">Access dashboard</p>
        </div>
      </div>

      {/* Back to login */}
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sign In
      </Link>
    </div>
  );
}
