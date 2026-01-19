'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolStatus } from './tool-status';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ToolCallProps {
  name: string;
  status?: 'pending' | 'running' | 'completed' | 'error';
  args?: Record<string, unknown>;
  result?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function ToolCall({
  name,
  status = 'completed',
  args,
  result,
  collapsible = true,
  defaultOpen = false,
  className,
}: ToolCallProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const content = (
    <>
      {args && Object.keys(args).length > 0 && (
        <div className="tool-call-content border-b border-border">
          <div className="text-xs text-muted-foreground mb-1">Arguments</div>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      )}
      {result && (
        <div className="tool-call-content">
          <div className="text-xs text-muted-foreground mb-1">Result</div>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-thin">
            {result}
          </pre>
        </div>
      )}
    </>
  );

  if (!collapsible) {
    return (
      <div className={cn('tool-call', className)}>
        <div className="tool-call-header">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium flex-1">{name}</span>
          <ToolStatus status={status} />
        </div>
        {content}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn('tool-call', className)}>
        <CollapsibleTrigger asChild>
          <button className="tool-call-header w-full text-left">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{name}</span>
            <ToolStatus status={status} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>{content}</CollapsibleContent>
      </div>
    </Collapsible>
  );
}
