import { cn } from '@/app/_lib/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

/**
 * Glass-morphism card component with optional hover effects.
 */
export function Card({
  children,
  className,
  hover = false,
  padding = 'md',
}: CardProps) {
  return (
    <div
      className={cn(
        'glass-card',
        hover && 'glass-card-hover cursor-pointer',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Card header with optional action slot.
 */
export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between pb-4',
        className
      )}
    >
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Card body content area.
 */
export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn(className)}>{children}</div>;
}
