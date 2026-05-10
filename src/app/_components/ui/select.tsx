'use client';

import { forwardRef } from 'react';
import { cn } from '@/app/_lib/utils/cn';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Premium Styled select dropdown with label and error state.
 * Designed to match the modern aesthetics of the Input component.
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5 w-full group">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[13px] font-bold text-text-secondary tracking-wide transition-colors group-focus-within:text-accent"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-xl border bg-bg-secondary/30 backdrop-blur-sm px-6 py-2.5 pr-12 text-sm text-text-primary outline-none',
              'transition-all duration-300 ease-out',
              'shadow-sm',
              'focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-tertiary',
              error
                ? 'border-danger focus:ring-danger/10 focus:border-danger'
                : 'border-border hover:border-accent/40',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-text-tertiary group-focus-within:text-accent transition-colors">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && (
          <p className="text-xs text-danger font-semibold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption };
