'use client';

import dynamic from 'next/dynamic';
import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { TerminalSkeleton } from './terminal-skeleton';
import type { TerminalCoreRef } from './terminal-core';
import { cn } from '@/lib/utils';

// Dynamically import TerminalCore to avoid SSR issues with xterm.js
const TerminalCore = dynamic(
  () => import('./terminal-core').then((mod) => mod.TerminalCore),
  {
    ssr: false,
    loading: () => <TerminalSkeleton />,
  }
);

export interface TerminalViewRef {
  write: (data: string) => void;
  clear: () => void;
  focus: () => void;
  fit: () => void;
}

interface TerminalViewProps {
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  className?: string;
}

export const TerminalView = forwardRef<TerminalViewRef, TerminalViewProps>(
  ({ onData, onResize, className }, ref) => {
    const internalRef = useRef<TerminalCoreRef>(null);

    // Forward methods from internal ref
    useEffect(() => {
      if (ref && typeof ref === 'object') {
        ref.current = {
          write: (data: string) => internalRef.current?.write(data),
          clear: () => internalRef.current?.clear(),
          focus: () => internalRef.current?.focus(),
          fit: () => internalRef.current?.fit(),
        };
      }
    }, [ref]);

    return (
      <div className={cn('h-full w-full', className)}>
        <TerminalCore
          ref={internalRef}
          onData={onData}
          onResize={onResize}
        />
      </div>
    );
  }
);

TerminalView.displayName = 'TerminalView';
