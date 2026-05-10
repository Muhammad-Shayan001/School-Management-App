'use client';

import { forwardRef } from 'react';
import { cn } from '@/app/_lib/utils/cn';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover shadow-sm hover:shadow-md active:scale-[0.98]',
  secondary:
    'bg-bg-tertiary text-text-primary border border-border hover:bg-bg-elevated hover:border-border-hover',
  danger:
    'bg-danger text-white hover:bg-red-600 active:scale-[0.98]',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-glass-hover',
  outline:
    'border border-border text-text-primary hover:bg-glass-hover hover:border-border-hover',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-base gap-2.5',
};

/**
 * Reusable button component with variants, sizes, loading state, and icons.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-bold rounded-xl whitespace-nowrap',
          'transition-all duration-300 ease-out active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-[1.1em] w-[1.1em] animate-spin flex-shrink-0" />
        ) : leftIcon ? (
          <span className="inline-flex items-center justify-center flex-shrink-0">{leftIcon}</span>
        ) : null}
        
        {children && (
          <span className="inline-block">{children}</span>
        )}

        {!isLoading && rightIcon && (
          <span className="inline-flex items-center justify-center flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
