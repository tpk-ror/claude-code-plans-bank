'use client';

import { Circle, Play, Square, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ConnectionStatus } from '@/lib/types';

interface ChatHeaderProps {
  connectionStatus: ConnectionStatus;
  sessionActive: boolean;
  isStarting: boolean;
  onStartSession: () => void;
  onStopSession: () => void;
  className?: string;
}

export function ChatHeader({
  connectionStatus,
  sessionActive,
  isStarting,
  onStartSession,
  onStopSession,
  className,
}: ChatHeaderProps) {
  const statusConfig: Record<
    ConnectionStatus,
    { label: string; color: string }
  > = {
    connected: { label: 'Connected', color: 'text-green-500' },
    connecting: { label: 'Connecting...', color: 'text-yellow-500' },
    disconnected: { label: 'Disconnected', color: 'text-red-500' },
  };

  const status = statusConfig[connectionStatus];

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b border-border bg-card',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Chat</h2>
        <div className="flex items-center gap-2">
          <Circle
            className={cn(
              'h-2 w-2 fill-current',
              connectionStatus === 'connected'
                ? 'text-green-500'
                : connectionStatus === 'connecting'
                ? 'text-yellow-500'
                : 'text-red-500'
            )}
          />
          <span className={cn('text-sm', status.color)}>{status.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!sessionActive ? (
          <Button
            size="sm"
            onClick={onStartSession}
            disabled={connectionStatus !== 'connected' || isStarting}
          >
            {isStarting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                New Session
              </>
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="destructive"
            onClick={onStopSession}
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Session
          </Button>
        )}
      </div>
    </div>
  );
}
