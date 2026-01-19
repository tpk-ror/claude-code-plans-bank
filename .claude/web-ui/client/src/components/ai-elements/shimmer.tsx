import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
  lines?: number;
}

/**
 * Shimmer loading animation component
 * Displays animated placeholder lines during streaming
 */
export function Shimmer({ className, lines = 3 }: ShimmerProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 rounded-md bg-gradient-to-r from-muted via-muted-foreground/10 to-muted',
            'bg-[length:200%_100%] animate-shimmer',
            // Vary widths for more natural appearance
            i === lines - 1 ? 'w-3/4' : i % 2 === 0 ? 'w-full' : 'w-5/6'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Inline shimmer for text content
 */
export function InlineShimmer({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-24 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted',
        'bg-[length:200%_100%] animate-shimmer align-middle',
        className
      )}
    />
  );
}
