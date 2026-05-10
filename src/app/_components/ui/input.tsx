'use client';

import { forwardRef } from 'react';
import { cn } from '@/app/_lib/utils/cn';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Premium Styled input component with label, error state, hint text, and icon support.
 * Features a modern, professional look with refined spacing and micro-interactions.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, value, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const inputProps = {
      ...props,
      ...(value !== undefined ? { value: value ?? '' } : {}),
    };

    return (
      <div className="space-y-2 w-full group">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-bold text-text-secondary tracking-wide transition-colors group-focus-within:text-accent"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-0 top-0 bottom-0 pl-4 flex items-center justify-center pointer-events-none text-text-tertiary group-focus-within:text-accent transition-colors">
              <div className="flex items-center">
                {leftIcon}
                <div className="h-4 w-[1px] bg-border mx-3 group-focus-within:bg-accent/30 transition-colors" />
              </div>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full appearance-none rounded-xl border bg-bg-secondary/20 backdrop-blur-sm py-3 text-sm text-text-primary outline-none',
              'placeholder:text-text-tertiary/60',
              'transition-all duration-300 ease-out',
              'shadow-sm',
              'focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-tertiary',
              error
                ? 'border-danger focus:ring-danger/10 focus:border-danger'
                : 'border-border hover:border-accent/30',
              leftIcon ? 'pl-14' : 'pl-4',
              rightIcon ? 'pr-11' : 'pr-4',
              className
            )}
            {...inputProps}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-text-tertiary group-focus-within:text-accent transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-danger font-semibold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 pl-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        ) : hint ? (
          <p className="text-[11px] text-text-tertiary font-medium pl-1">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
