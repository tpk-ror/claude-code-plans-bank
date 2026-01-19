'use client';

import { X, FileText, Image, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  preview?: string;
}

interface FilePreviewProps {
  files: FileAttachment[];
  onRemove?: (index: number) => void;
  className?: string;
}

export function FilePreview({ files, onRemove, className }: FilePreviewProps) {
  if (files.length === 0) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    if (type.includes('text') || type.includes('json')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg group"
        >
          {file.preview && file.type.startsWith('image/') ? (
            <img
              src={file.preview}
              alt={file.name}
              className="h-8 w-8 object-cover rounded"
            />
          ) : (
            <div className="h-8 w-8 flex items-center justify-center bg-muted rounded">
              {getFileIcon(file.type)}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate max-w-[150px]">
              {file.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatSize(file.size)}
            </span>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
