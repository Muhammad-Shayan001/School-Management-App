import { cn } from '@/app/_lib/utils/cn';
import { getInitials } from '@/app/_lib/utils/format';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  online?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const dotSizes = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
};

/**
 * Avatar component with image fallback to initials and online status dot.
 */
export function Avatar({ src, name, size = 'md', className, online }: AvatarProps) {
  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={cn(
            'rounded-full object-cover ring-2 ring-glass-border',
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium',
            'bg-accent/20 text-accent ring-2 ring-glass-border',
            sizeClasses[size]
          )}
        >
          {name ? getInitials(name) : '?'}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-bg-secondary',
            dotSizes[size],
            online ? 'bg-success' : 'bg-text-tertiary'
          )}
        />
      )}
    </div>
  );
}
