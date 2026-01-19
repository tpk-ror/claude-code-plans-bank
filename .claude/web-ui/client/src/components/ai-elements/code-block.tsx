import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  showLineNumbers?: boolean;
}

/**
 * Code block component with syntax highlighting and copy functionality
 */
export function CodeBlock({
  code,
  language = 'plaintext',
  filename,
  className,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [code]);

  const lines = code.split('\n');

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border',
        'bg-secondary',
        className
      )}
    >
      {/* Header with language/filename and copy button */}
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {filename || language}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-xs',
            'text-muted-foreground hover:text-foreground',
            'transition-colors hover:bg-accent',
            'opacity-0 focus:opacity-100 group-hover:opacity-100'
          )}
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 font-mono text-sm leading-relaxed">
          {showLineNumbers ? (
            <code className="grid">
              {lines.map((line, i) => (
                <span key={i} className="flex">
                  <span className="w-8 shrink-0 select-none pr-4 text-right text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1">{line || ' '}</span>
                </span>
              ))}
            </code>
          ) : (
            <code>{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
}

/**
 * Inline code component
 */
export function InlineCode({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code
      className={cn(
        'rounded px-1.5 py-0.5 font-mono text-sm',
        'bg-muted text-brand',
        className
      )}
    >
      {children}
    </code>
  );
}
