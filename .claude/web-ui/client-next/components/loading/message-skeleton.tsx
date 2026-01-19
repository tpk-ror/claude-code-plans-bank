import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface MessageSkeletonProps {
  role?: 'user' | 'assistant';
  className?: string;
}

export function MessageSkeleton({ role = 'assistant', className }: MessageSkeletonProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      <Skeleton className={cn('h-8 w-8 rounded-full shrink-0')} />
      <div
        className={cn(
          'space-y-2 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
    </div>
  );
}
