import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Message } from './message';
import { Shimmer } from './shimmer';
import type { ParsedMessage } from '@/lib/message-parser';

interface ConversationProps {
  messages: ParsedMessage[];
  isStreaming?: boolean;
  className?: string;
  autoScroll?: boolean;
}

/**
 * Conversation container component
 * Renders a scrollable list of messages with auto-scroll behavior
 */
export function Conversation({
  messages,
  isStreaming = false,
  className,
  autoScroll = true,
}: ConversationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!autoScroll || !containerRef.current) return;

    // Only auto-scroll if new messages were added
    if (messages.length > lastMessageCountRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }

    lastMessageCountRef.current = messages.length;
  }, [messages.length, autoScroll]);

  // Also scroll when streaming content updates
  useEffect(() => {
    if (!autoScroll || !containerRef.current || !isStreaming) return;

    const scrollToBottom = () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    };

    // Debounce scroll updates during streaming
    const timeoutId = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timeoutId);
  }, [messages, isStreaming, autoScroll]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center p-8',
          'text-muted-foreground',
          className
        )}
      >
        <div className="max-w-md text-center">
          <h3 className="mb-2 text-lg font-medium">No messages yet</h3>
          <p className="text-sm">
            Messages from the terminal session will appear here as a structured conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex-1 overflow-y-auto px-4',
        className
      )}
    >
      <div className="mx-auto max-w-3xl py-4">
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            isStreaming={isStreaming && index === messages.length - 1}
          />
        ))}

        {/* Show shimmer when streaming but no messages yet */}
        {isStreaming && messages.length === 0 && (
          <div className="py-4">
            <Shimmer lines={3} />
          </div>
        )}
      </div>
    </div>
  );
}
