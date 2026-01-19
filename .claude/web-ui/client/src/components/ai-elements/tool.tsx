import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToolStatus = 'pending' | 'running' | 'completed' | 'error';

interface ToolProps {
  name: string;
  args?: Record<string, unknown>;
  result?: string;
  status?: ToolStatus;
  className?: string;
  defaultExpanded?: boolean;
}

/**
 * Tool invocation display component
 * Shows tool name, arguments, and results in a collapsible format
 */
export function Tool({
  name,
  args,
  result,
  status = 'completed',
  className,
  defaultExpanded = false,
}: ToolProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const statusIcon = {
    pending: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    running: <Loader2 className="h-4 w-4 animate-spin text-info" />,
    completed: <CheckCircle2 className="h-4 w-4 text-success" />,
    error: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const statusText = {
    pending: 'Pending',
    running: 'Running...',
    completed: 'Completed',
    error: 'Failed',
  };

  const hasDetails = args || result;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border',
        'bg-secondary',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        disabled={!hasDetails}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left',
          'transition-colors hover:bg-accent',
          !hasDetails && 'cursor-default'
        )}
      >
        {/* Expand/collapse icon */}
        {hasDetails ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Tool icon and name */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {name}
          </span>
        </div>

        {/* Status */}
        <div className="flex shrink-0 items-center gap-2">
          {statusIcon[status]}
          <span className="text-xs text-muted-foreground">{statusText[status]}</span>
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && hasDetails && (
        <div className="border-t border-border">
          {/* Arguments */}
          {args && Object.keys(args).length > 0 && (
            <div className="border-b border-border px-4 py-3">
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Arguments
              </h4>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm text-muted-foreground">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="px-4 py-3">
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Result
              </h4>
              <pre className="max-h-48 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-all font-mono text-sm text-muted-foreground">
                {result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact tool indicator for inline display
 */
export function ToolIndicator({
  name,
  status = 'completed',
  className,
}: {
  name: string;
  status?: ToolStatus;
  className?: string;
}) {
  const statusColors = {
    pending: 'text-muted-foreground',
    running: 'text-info',
    completed: 'text-success',
    error: 'text-destructive',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs',
        'bg-muted',
        statusColors[status],
        className
      )}
    >
      <Wrench className="h-3 w-3" />
      {name}
    </span>
  );
}
