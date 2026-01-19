'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Terminal, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/code/code-block';
import { InlineCode } from '@/components/code/inline-code';
import { ToolCall } from '@/components/tools/tool-call';
import type { ParsedMessage } from '@/lib/message-parser';

interface MessageBubbleProps {
  message: ParsedMessage;
  className?: string;
}

export function MessageBubble({ message, className }: MessageBubbleProps) {
  const { role, content, metadata } = message;

  const avatarIcon = useMemo(() => {
    switch (role) {
      case 'user':
        return <User className="h-5 w-5" />;
      case 'assistant':
        return <Bot className="h-5 w-5" />;
      case 'tool':
        return <Terminal className="h-5 w-5" />;
      case 'system':
        return <Info className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  }, [role]);

  const bubbleClass = useMemo(() => {
    switch (role) {
      case 'user':
        return 'message-bubble-user';
      case 'assistant':
        return 'message-bubble-assistant';
      case 'tool':
        return 'message-bubble-tool';
      case 'system':
        return 'message-bubble-system';
      default:
        return 'message-bubble-assistant';
    }
  }, [role]);

  // Handle tool messages
  if (role === 'tool' && metadata?.toolName) {
    return (
      <div className={cn('flex gap-3', className)}>
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            'bg-secondary text-secondary-foreground'
          )}
        >
          {avatarIcon}
        </div>
        <div className="flex-1 min-w-0">
          <ToolCall
            name={metadata.toolName}
            status={metadata.toolStatus}
            args={metadata.toolArgs}
            result={metadata.toolResult}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3',
        role === 'user' ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {avatarIcon}
      </div>
      <div className={cn('message-bubble', bubbleClass, 'min-w-0')}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ className: codeClassName, children, ...props }) => {
              const match = /language-(\w+)/.exec(codeClassName || '');
              const isInline = !match && !codeClassName;

              if (isInline) {
                return <InlineCode {...props}>{children}</InlineCode>;
              }

              return (
                <CodeBlock
                  code={String(children).replace(/\n$/, '')}
                  language={match?.[1] || 'plaintext'}
                />
              );
            },
            pre: ({ children }) => <>{children}</>,
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => (
              <ul className="mb-2 ml-4 list-disc last:mb-0">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-2 ml-4 list-decimal last:mb-0">{children}</ol>
            ),
            li: ({ children }) => <li className="mb-1">{children}</li>,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
                {children}
              </blockquote>
            ),
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-bold mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-bold mb-2">{children}</h3>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
