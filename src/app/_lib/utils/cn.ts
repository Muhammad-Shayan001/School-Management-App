import { clsx, type ClassValue } from 'clsx';

/**
 * Merge Tailwind classes with clsx for conditional class names.
 * Usage: cn('base-class', condition && 'conditional-class', 'another-class')
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
