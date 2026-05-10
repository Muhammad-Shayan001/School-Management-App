import { cn } from '@/app/_lib/utils/cn';

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1 px-4 py-3 bg-bg-elevated border border-border rounded-2xl rounded-bl-sm w-fit", className)}>
      <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full typing-dot"></div>
      <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full typing-dot"></div>
      <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full typing-dot"></div>
    </div>
  );
}
