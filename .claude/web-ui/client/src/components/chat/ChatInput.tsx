import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Chat input component with multi-line support
 * Sends message on Enter, Shift+Enter for new line
 */
export function ChatInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = 'Ask Claude to help plan a feature...',
  className,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled && !isLoading) {
      onSend(trimmed);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const isDisabled = disabled || isLoading;
  const canSend = input.trim().length > 0 && !isDisabled;

  return (
    <div
      className={cn(
        'flex items-end gap-2 border-t border-border bg-card p-3',
        className
      )}
    >
      <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={1}
          className={cn(
            'min-h-[48px] max-h-[200px] resize-none pr-16',
            'bg-background'
          )}
        />
        {input.length > 0 && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground opacity-60">
            Enter to send
          </div>
        )}
      </div>

      <Button
        onClick={handleSend}
        disabled={!canSend}
        variant="brand"
        size="icon"
        className="h-12 w-12 shrink-0"
        title={isLoading ? 'Processing...' : 'Send message'}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
