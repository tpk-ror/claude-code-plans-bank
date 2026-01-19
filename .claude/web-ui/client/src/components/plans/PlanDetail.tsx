import { useState } from 'react';
import { X, Play, FileText, Archive, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Plan } from '@/lib/types';

interface PlanDetailProps {
  plan: Plan | null;
  onClose: () => void;
  onStartSession: (plan: Plan) => void;
  onAddNote: (filename: string) => void;
  onArchive: (filename: string) => void;
  onStatusChange: (filename: string, status: Plan['status']) => void;
}

function formatStatus(status: string): string {
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getStatusVariant(status: Plan['status']): 'success' | 'warning' | 'info' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'in-progress':
      return 'info';
    default:
      return 'info';
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function PlanDetail({
  plan,
  onClose,
  onStartSession,
  onAddNote,
  onArchive,
  onStatusChange,
}: PlanDetailProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!plan) {
    return null;
  }

  const statuses: Plan['status'][] = ['pending', 'in-progress', 'completed'];

  return (
    <div
      className={cn(
        'border-t border-border bg-card transition-all duration-200',
        isCollapsed ? 'h-10' : 'h-52'
      )}
    >
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-sm font-medium hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                isCollapsed && '-rotate-90'
              )}
            />
            <span className="line-clamp-1">{plan.title}</span>
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          title="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex h-[calc(100%-40px)] gap-6 overflow-y-auto p-4">
          {/* Left column - Status & Description */}
          <div className="flex-1 space-y-4">
            {/* Status */}
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Status
              </span>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge
                      variant={getStatusVariant(plan.status)}
                      className="cursor-pointer"
                    >
                      {formatStatus(plan.status)}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {statuses.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => onStatusChange(plan.filename, status)}
                      >
                        {formatStatus(status)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Description */}
            {plan.description && (
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Description
                </span>
                <p className="text-sm text-foreground">{plan.description}</p>
              </div>
            )}
          </div>

          {/* Middle column - Info */}
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Info
              </span>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Category:</span>{' '}
                  <span className="capitalize">{plan.category}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Priority:</span>{' '}
                  <span className="capitalize">{plan.priority}</span>
                </p>
                {plan.tags && plan.tags.length > 0 && (
                  <p>
                    <span className="text-muted-foreground">Tags:</span>{' '}
                    {plan.tags.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Dates
              </span>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Created:</span>{' '}
                  {formatDate(plan.createdAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">Updated:</span>{' '}
                  {formatDate(plan.updatedAt)}
                </p>
                {plan.completedAt && (
                  <p>
                    <span className="text-muted-foreground">Completed:</span>{' '}
                    {formatDate(plan.completedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="brand"
              size="sm"
              onClick={() => onStartSession(plan)}
            >
              <Play className="mr-1 h-4 w-4" />
              Start Session
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNote(plan.filename)}
            >
              <FileText className="mr-1 h-4 w-4" />
              Add Note
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm(`Are you sure you want to archive "${plan.filename}"?`)) {
                  onArchive(plan.filename);
                }
              }}
            >
              <Archive className="mr-1 h-4 w-4" />
              Archive
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
