import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Terminal, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeBlock, InlineCode } from './code-block';
import { Tool } from './tool';
import { Shimmer } from './shimmer';
import type { ParsedMessage } from '@/lib/message-parser';

interface MessageProps {
  message: ParsedMessage;
  isStreaming?: boolean;
  className?: string;
}

/**
 * Message bubble component
 * Renders different styles based on message role (user/assistant/tool/system)
 */
export function Message({ message, isStreaming, className }: MessageProps) {
  const { role, content, metadata } = message;

  // Role-specific styling and icons
  const roleConfig = {
    user: {
      icon: User,
      label: 'You',
      containerClass: 'bg-brand/10 border-brand/20',
      iconClass: 'bg-brand text-brand-foreground',
    },
    assistant: {
      icon: Bot,
      label: 'Claude',
      containerClass: 'bg-secondary border-border',
      iconClass: 'bg-muted text-muted-foreground',
    },
    tool: {
      icon: Terminal,
      label: 'Tool',
      containerClass: 'bg-secondary border-border',
      iconClass: 'bg-info/20 text-info',
    },
    system: {
      icon: Info,
      label: 'System',
      containerClass: 'bg-warning/10 border-warning/20',
      iconClass: 'bg-warning/20 text-warning',
    },
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  // If this is a tool message with metadata, render the Tool component
  if (role === 'tool' && metadata?.toolName) {
    return (
      <div className={cn('py-2', className)}>
        <Tool
          name={metadata.toolName}
          args={metadata.toolArgs}
          result={metadata.toolResult}
          status={metadata.toolStatus}
          defaultExpanded={false}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3 py-3', className)}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          config.iconClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Role label */}
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          {config.label}
        </div>

        {/* Message content */}
        <div
          className={cn(
            'rounded-lg border px-4 py-3',
            config.containerClass
          )}
        >
          {/* If there's a code block in metadata, render it specially */}
          {metadata?.codeBlock ? (
            <div className="space-y-3">
              <MessageContent content={content.replace(/```[\s\S]*```/g, '').trim()} />
              <CodeBlock
                code={metadata.codeBlock.code}
                language={metadata.codeBlock.language}
              />
            </div>
          ) : (
            <MessageContent content={content} />
          )}

          {/* Streaming indicator */}
          {isStreaming && role === 'assistant' && (
            <div className="mt-3">
              <Shimmer lines={2} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Message content renderer with markdown support
 */
function MessageContent({ content }: { content: string }) {
  // Memoize markdown components
  const markdownComponents = useMemo(
    () => ({
      code({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { className?: string }) {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && !String(children).includes('\n');

        if (isInline) {
          return <InlineCode {...props}>{children}</InlineCode>;
        }

        return (
          <CodeBlock
            code={String(children).replace(/\n$/, '')}
            language={match?.[1] || 'plaintext'}
            className="my-3"
          />
        );
      },
      p({ children }: { children?: React.ReactNode }) {
        return <p className="mb-2 leading-relaxed last:mb-0">{children}</p>;
      },
      ul({ children }: { children?: React.ReactNode }) {
        return <ul className="mb-2 list-inside list-disc space-y-1">{children}</ul>;
      },
      ol({ children }: { children?: React.ReactNode }) {
        return <ol className="mb-2 list-inside list-decimal space-y-1">{children}</ol>;
      },
      li({ children }: { children?: React.ReactNode }) {
        return <li className="text-foreground">{children}</li>;
      },
      a({ href, children }: { href?: string; children?: React.ReactNode }) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            {children}
          </a>
        );
      },
      strong({ children }: { children?: React.ReactNode }) {
        return <strong className="font-semibold">{children}</strong>;
      },
      em({ children }: { children?: React.ReactNode }) {
        return <em className="italic">{children}</em>;
      },
      blockquote({ children }: { children?: React.ReactNode }) {
        return (
          <blockquote className="my-2 border-l-4 border-brand pl-4 italic text-muted-foreground">
            {children}
          </blockquote>
        );
      },
      h1({ children }: { children?: React.ReactNode }) {
        return <h1 className="mb-2 text-xl font-bold">{children}</h1>;
      },
      h2({ children }: { children?: React.ReactNode }) {
        return <h2 className="mb-2 text-lg font-bold">{children}</h2>;
      },
      h3({ children }: { children?: React.ReactNode }) {
        return <h3 className="mb-2 text-base font-bold">{children}</h3>;
      },
      hr() {
        return <hr className="my-4 border-border" />;
      },
    }),
    []
  );

  if (!content.trim()) {
    return null;
  }

  return (
    <div className="prose prose-sm max-w-none text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
