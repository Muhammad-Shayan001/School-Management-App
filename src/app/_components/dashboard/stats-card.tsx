import { cn } from '@/app/_lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: 'bg-bg-tertiary',
    iconColor: 'text-text-secondary',
  },
  accent: {
    iconBg: 'bg-accent-subtle',
    iconColor: 'text-accent',
  },
  success: {
    iconBg: 'bg-success-subtle',
    iconColor: 'text-success',
  },
  warning: {
    iconBg: 'bg-warning-subtle',
    iconColor: 'text-warning',
  },
  danger: {
    iconBg: 'bg-danger-subtle',
    iconColor: 'text-danger',
  },
};

/**
 * Analytics stats card with icon, value, trend indicator, and subtitle.
 */
export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'glass-card glass-card-hover p-6 group transition-all duration-500 rounded-[1.75rem] border border-border/70 bg-white/95 shadow-[0_16px_40px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.12)]',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter truncate leading-tight">
              {value}
            </h3>
            {trend && (
              <div className="flex items-center gap-1 mb-1">
                <span
                  className={cn(
                    'text-[10px] font-black tracking-tighter px-1.5 py-0.5 rounded-md leading-none',
                    trend.value >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  )}
                >
                  {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] font-semibold text-slate-600 truncate leading-none">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={cn(
            'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 border border-white/70',
            styles.iconBg
          )}
        >
          <Icon className={cn('h-6 w-6', styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
