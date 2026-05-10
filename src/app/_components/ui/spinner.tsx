import { cn } from '@/app/_lib/utils/cn';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

/**
 * Loading spinner component with optional label.
 */
export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={cn('animate-spin text-accent', sizeClasses[size], className)}
      />
      {label && (
        <p className="text-sm text-text-secondary animate-pulse">{label}</p>
      )}
    </div>
  );
}

/**
 * Full page loading state with spinner.
 */
export function PageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}
