'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { cn } from '@/lib/utils';

export interface TerminalCoreRef {
  write: (data: string) => void;
  clear: () => void;
  focus: () => void;
  fit: () => void;
}

interface TerminalCoreProps {
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  className?: string;
}

export const TerminalCore = forwardRef<TerminalCoreRef, TerminalCoreProps>(
  ({ onData, onResize, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    useImperativeHandle(ref, () => ({
      write: (data: string) => {
        terminalRef.current?.write(data);
      },
      clear: () => {
        terminalRef.current?.clear();
      },
      focus: () => {
        terminalRef.current?.focus();
      },
      fit: () => {
        fitAddonRef.current?.fit();
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const terminal = new Terminal({
        cursorBlink: true,
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        theme: {
          background: '#1a1a1a',
          foreground: '#e4e4e4',
          cursor: '#e4e4e4',
          cursorAccent: '#1a1a1a',
          selectionBackground: '#3a3a3a',
          black: '#1a1a1a',
          red: '#ef4444',
          green: '#22c55e',
          yellow: '#f59e0b',
          blue: '#3b82f6',
          magenta: '#a855f7',
          cyan: '#06b6d4',
          white: '#e4e4e4',
          brightBlack: '#6b7280',
          brightRed: '#f87171',
          brightGreen: '#4ade80',
          brightYellow: '#fbbf24',
          brightBlue: '#60a5fa',
          brightMagenta: '#c084fc',
          brightCyan: '#22d3ee',
          brightWhite: '#ffffff',
        },
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      terminal.open(containerRef.current);
      fitAddon.fit();

      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Handle user input
      terminal.onData((data) => {
        onData?.(data);
      });

      // Handle resize
      const handleResize = () => {
        fitAddon.fit();
        onResize?.(terminal.cols, terminal.rows);
      };

      // Initial resize notification
      onResize?.(terminal.cols, terminal.rows);

      // Observe container resize
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);

      // Window resize listener
      window.addEventListener('resize', handleResize);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
        terminal.dispose();
      };
    }, [onData, onResize]);

    return (
      <div
        ref={containerRef}
        className={cn('terminal-container h-full w-full', className)}
      />
    );
  }
);

TerminalCore.displayName = 'TerminalCore';
