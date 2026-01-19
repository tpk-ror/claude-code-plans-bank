'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { StreamingIndicator } from './streaming-indicator';
import { MessageSkeleton } from '@/components/loading/message-skeleton';
import type { ParsedMessage } from '@/lib/message-parser';

interface MessageListProps {
  messages: ParsedMessage[];
  isStreaming?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  isStreaming = false,
  isLoading = false,
  className,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (isLoading) {
    return (
      <div className={cn('flex-1 p-4 space-y-4', className)}>
        <MessageSkeleton role="user" />
        <MessageSkeleton role="assistant" />
        <MessageSkeleton role="assistant" />
      </div>
    );
  }

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Start a session to begin chatting with Claude</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={cn('flex-1', className)} ref={scrollRef}>
      <div className="p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isStreaming && <StreamingIndicator />}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
