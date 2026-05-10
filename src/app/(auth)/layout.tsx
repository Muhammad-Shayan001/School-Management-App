import { BookOpen } from 'lucide-react';

/**
 * Auth layout — centered card layout with animated gradient background.
 * Used for login, signup, and pending approval pages.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-background min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2.5 mb-8 animate-fade-in">
        <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-text-primary tracking-tight">
          SchoolMS
        </span>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md animate-slide-in-up">
        <div className="glass-card p-8 bg-bg-secondary/80 backdrop-blur-2xl border-glass-border shadow-2xl">
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-xs text-text-tertiary animate-fade-in">
        © {new Date().getFullYear()} SchoolMS — School Management System
      </p>
    </div>
  );
}
