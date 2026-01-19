import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TerminalSkeletonProps {
  className?: string;
}

export function TerminalSkeleton({ className }: TerminalSkeletonProps) {
  return (
    <div className={cn('h-full w-full bg-[#1a1a1a] p-4 space-y-2', className)}>
      <Skeleton className="h-4 w-1/3 bg-neutral-800" />
      <Skeleton className="h-4 w-2/3 bg-neutral-800" />
      <Skeleton className="h-4 w-1/2 bg-neutral-800" />
      <Skeleton className="h-4 w-3/4 bg-neutral-800" />
      <Skeleton className="h-4 w-1/4 bg-neutral-800" />
    </div>
  );
}
