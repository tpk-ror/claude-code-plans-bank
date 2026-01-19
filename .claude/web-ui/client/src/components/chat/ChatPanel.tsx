import { MessageSquare, X, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Conversation } from '@/components/ai-elements';
import { ChatInput } from './ChatInput';
import type { ParsedMessage } from '@/lib/message-parser';

interface SessionError {
  message: string;
  code?: string;
}

interface ChatPanelProps {
  messages: ParsedMessage[];
  isStreaming: boolean;
  isVisible: boolean;
  isExpanded?: boolean;
  sessionActive?: boolean;
  isStarting?: boolean;
  sessionError?: SessionError | null;
  onToggleVisibility: () => void;
  onToggleExpand?: () => void;
  onSendMessage?: (message: string) => void;
  onClearError?: () => void;
  className?: string;
}

/**
 * Chat panel component that displays structured messages alongside the terminal
 */
export function ChatPanel({
  messages,
  isStreaming,
  isVisible,
  isExpanded = false,
  sessionActive = false,
  isStarting = false,
  sessionError,
  onToggleVisibility,
  onToggleExpand,
  onSendMessage,
  onClearError,
  className,
}: ChatPanelProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col border-l border-border bg-card',
        isExpanded ? 'flex-1' : 'w-[400px] min-w-[300px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Chat View</span>
          {messages.length > 0 && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {messages.length}
            </span>
          )}
          {sessionActive && (
            <span className="flex items-center gap-1 text-xs text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleExpand}
              title={isExpanded ? 'Collapse panel' : 'Expand panel'}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleVisibility}
            title="Hide chat panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {sessionError && (
        <div className="flex items-start gap-3 border-b border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Session Error</p>
            <p className="mt-0.5 text-xs opacity-90">{sessionError.message}</p>
            {sessionError.code && (
              <p className="mt-1 text-xs opacity-70">Code: {sessionError.code}</p>
            )}
          </div>
          {onClearError && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:bg-destructive/20"
              onClick={onClearError}
              title="Dismiss error"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Conversation */}
      <Conversation
        messages={messages}
        isStreaming={isStreaming}
        className="flex-1"
      />

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="border-t border-border bg-card px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
            </span>
            Claude is responding...
          </div>
        </div>
      )}

      {/* Chat Input */}
      {onSendMessage && (
        <ChatInput
          onSend={onSendMessage}
          disabled={!sessionActive && !isStarting}
          isLoading={isStarting}
          placeholder={
            !sessionActive && !isStarting
              ? 'Start a session to chat with Claude...'
              : 'Ask Claude to help plan a feature...'
          }
        />
      )}
    </div>
  );
}

/**
 * Toggle button for showing the chat panel when hidden
 */
export function ChatPanelToggle({
  isVisible,
  messageCount,
  onClick,
  className,
}: {
  isVisible: boolean;
  messageCount: number;
  onClick: () => void;
  className?: string;
}) {
  if (isVisible) {
    return null;
  }

  return (
    <Button
      onClick={onClick}
      variant="brand"
      className={cn(
        'fixed bottom-4 right-4 z-50 gap-2 rounded-full shadow-lg',
        className
      )}
    >
      <MessageSquare className="h-4 w-4" />
      <span className="text-sm font-medium">Show Chat</span>
      {messageCount > 0 && (
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
          {messageCount}
        </span>
      )}
    </Button>
  );
}
