import { cn } from '@/app/_lib/utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-bg-tertiary text-text-secondary border-border',
  success: 'bg-success-subtle text-success border-success/20',
  warning: 'bg-warning-subtle text-warning border-warning/20',
  danger: 'bg-danger-subtle text-danger border-danger/20',
  info: 'bg-info-subtle text-info border-info/20',
  accent: 'bg-accent-subtle text-accent border-accent/20',
};

/**
 * Status badge component with color variants and optional dot indicator.
 */
export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap',
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full flex-shrink-0',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'danger' && 'bg-danger',
            variant === 'info' && 'bg-info',
            variant === 'accent' && 'bg-accent',
            variant === 'default' && 'bg-text-tertiary'
          )}
        />
      )}
      <span className="leading-none">{children}</span>
    </span>
  );
}
