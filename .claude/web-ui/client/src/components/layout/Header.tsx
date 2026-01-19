import { Sun, Moon, Plus, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '@/lib/types';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  isDark: boolean;
  onNewPlan: () => void;
  onToggleTheme: () => void;
}

export function Header({
  connectionStatus,
  isDark,
  onNewPlan,
  onToggleTheme,
}: HeaderProps) {
  const isConnected = connectionStatus === 'connected';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Left section - Logo */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold tracking-tight">
          Claude Code Plans
        </h1>
      </div>

      {/* Center section - Connection status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className={cn(
            'flex h-2 w-2 rounded-full',
            isConnected ? 'bg-success' : 'bg-destructive'
          )}
        />
        <span className="hidden sm:inline">
          {connectionStatus === 'connecting'
            ? 'Connecting...'
            : isConnected
            ? 'Connected'
            : 'Disconnected'}
        </span>
        {isConnected ? (
          <Wifi className="h-4 w-4 sm:hidden" />
        ) : (
          <WifiOff className="h-4 w-4 sm:hidden" />
        )}
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={onNewPlan} size="sm" variant="brand">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Plan</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
