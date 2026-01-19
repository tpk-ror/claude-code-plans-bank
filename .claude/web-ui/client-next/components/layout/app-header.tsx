'use client';

import { Bot, Circle, Github, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from './theme-toggle';
import { useClaudeSession } from '@/hooks';

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  const session = useClaudeSession();

  const statusConfig = {
    connected: { label: 'Connected', color: 'text-green-500 fill-green-500' },
    connecting: { label: 'Connecting...', color: 'text-yellow-500 fill-yellow-500' },
    disconnected: { label: 'Disconnected', color: 'text-red-500 fill-red-500' },
  };

  const status = statusConfig[session.connectionStatus];

  return (
    <TooltipProvider>
      <header
        className={cn(
          'flex items-center justify-between h-14 px-4 border-b border-border bg-card',
          className
        )}
      >
        {/* Left section - Logo and title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Claude Web UI</h1>
          </div>
        </div>

        {/* Center section - Connection status */}
        <div className="flex items-center gap-2">
          <Circle className={cn('h-2 w-2', status.color)} />
          <span className="text-sm text-muted-foreground">{status.label}</span>
          {session.sessionId && (
            <span className="text-xs text-muted-foreground">
              (Session: {session.sessionId.slice(0, 8)}...)
            </span>
          )}
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                <a
                  href="https://github.com/anthropics/claude-code"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>GitHub</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Help</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help</TooltipContent>
          </Tooltip>

          <ThemeToggle />
        </div>
      </header>
    </TooltipProvider>
  );
}
