import { cn } from '@/lib/utils';
import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react';

type ToolStatusType = 'pending' | 'running' | 'completed' | 'error';

interface ToolStatusProps {
  status: ToolStatusType;
  className?: string;
}

export function ToolStatus({ status, className }: ToolStatusProps) {
  const statusConfig: Record<
    ToolStatusType,
    { icon: React.ReactNode; label: string; color: string }
  > = {
    pending: {
      icon: <Circle className="h-4 w-4" />,
      label: 'Pending',
      color: 'text-muted-foreground',
    },
    running: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      label: 'Running',
      color: 'text-blue-500',
    },
    completed: {
      icon: <CheckCircle className="h-4 w-4" />,
      label: 'Completed',
      color: 'text-green-500',
    },
    error: {
      icon: <XCircle className="h-4 w-4" />,
      label: 'Error',
      color: 'text-red-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-1.5', config.color, className)}>
      {config.icon}
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
}
