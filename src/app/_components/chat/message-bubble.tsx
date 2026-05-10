import { cn } from '@/app/_lib/utils/cn';

interface MessageBubbleProps {
  content: string;
  isOwn: boolean;
  time: string;
}

export function MessageBubble({ content, isOwn, time }: MessageBubbleProps) {
  return (
    <div className={cn('flex flex-col max-w-[75%]', isOwn ? 'self-end items-end' : 'self-start items-start')}>
      <div
        className={cn(
          'px-4 py-2.5 rounded-2xl text-sm',
          isOwn
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-bg-elevated border border-border text-text-primary rounded-bl-sm'
        )}
      >
        {content}
      </div>
      <span className="text-[10px] text-text-tertiary mt-1 px-1">{time}</span>
    </div>
  );
}
