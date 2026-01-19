'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FilePreview } from './file-preview';

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  preview?: string;
  file: File;
}

interface ChatInputProps {
  onSubmit: (message: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = 'Type a message...',
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;

    onSubmit(
      trimmedMessage,
      attachments.length > 0 ? attachments.map((a) => a.file) : undefined
    );
    setMessage('');
    setAttachments([]);
  }, [message, attachments, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newAttachments: FileAttachment[] = await Promise.all(
        Array.from(files).map(async (file) => {
          let preview: string | undefined;
          if (file.type.startsWith('image/')) {
            preview = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
          }
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            preview,
            file,
          };
        })
      );

      setAttachments((prev) => [...prev, ...newAttachments]);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    []
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={cn('border-t border-border bg-background p-4', className)}>
      {attachments.length > 0 && (
        <FilePreview
          files={attachments}
          onRemove={handleRemoveAttachment}
          className="mb-3"
        />
      )}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.txt,.md,.json,.csv,.pdf"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0"
        >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="min-h-[44px] max-h-[200px] resize-none"
        />
        <Button
          type="button"
          size="icon"
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          onClick={handleSubmit}
          className="shrink-0"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
