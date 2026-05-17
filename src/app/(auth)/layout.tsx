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
      <div className="relative z-10 flex flex-col items-center gap-3 mb-12 animate-fade-in group cursor-default">
        <div className="h-14 w-14 flex items-center justify-center overflow-hidden transform group-hover:scale-110 transition-all duration-700">
          <img src="/images/Skolic app icon.png" alt="Skolic" className="h-14 w-14 object-contain brightness-110 drop-shadow-lg" />
        </div>
        <img src="/images/Skolic logo.png" alt="Skolic" className="h-10 w-auto object-contain brightness-110" />
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md animate-slide-in-up">
        <div className="glass-card p-8 bg-bg-secondary/80 backdrop-blur-2xl border-glass-border shadow-2xl">
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-xs text-text-tertiary animate-fade-in">
        © {new Date().getFullYear()} Skolic — School Management System
      </p>
    </div>
  );
}
