'use client';

import { ChevronDown, ChevronUp, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TerminalHeaderProps {
  isCollapsed: boolean;
  isMaximized: boolean;
  onToggleCollapse: () => void;
  onToggleMaximize: () => void;
  onClear?: () => void;
  className?: string;
}

export function TerminalHeader({
  isCollapsed,
  isMaximized,
  onToggleCollapse,
  onToggleMaximize,
  onClear,
  className,
}: TerminalHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2 bg-card border-t border-border',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onToggleCollapse}
        >
          {isCollapsed ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isCollapsed ? 'Expand' : 'Collapse'} terminal
          </span>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          Terminal
        </span>
      </div>
      <div className="flex items-center gap-1">
        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onClear}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Clear terminal</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onToggleMaximize}
        >
          {isMaximized ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isMaximized ? 'Minimize' : 'Maximize'} terminal
          </span>
        </Button>
      </div>
    </div>
  );
}
