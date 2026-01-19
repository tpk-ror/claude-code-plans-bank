import { cn } from '@/lib/utils';

interface ShimmerProps {
  lines?: number;
  className?: string;
}

export function Shimmer({ lines = 3, className }: ShimmerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 rounded shimmer bg-muted',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}
