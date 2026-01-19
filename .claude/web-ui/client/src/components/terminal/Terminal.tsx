import { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalProps {
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  hasSession: boolean;
  isDark?: boolean;
}

const darkTheme = {
  background: '#1a1a1a',
  foreground: '#e4e4e4',
  cursor: '#e4e4e4',
  cursorAccent: '#1a1a1a',
  selectionBackground: 'rgba(99, 102, 241, 0.3)',
  black: '#1a1a1a',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  magenta: '#a855f7',
  cyan: '#06b6d4',
  white: '#e4e4e4',
  brightBlack: '#707070',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#fbbf24',
  brightBlue: '#60a5fa',
  brightMagenta: '#c084fc',
  brightCyan: '#22d3ee',
  brightWhite: '#ffffff',
};

const lightTheme = {
  background: '#fafafa',
  foreground: '#1a1a1a',
  cursor: '#1a1a1a',
  cursorAccent: '#fafafa',
  selectionBackground: 'rgba(99, 102, 241, 0.2)',
  black: '#1a1a1a',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#ca8a04',
  blue: '#2563eb',
  magenta: '#9333ea',
  cyan: '#0891b2',
  white: '#fafafa',
  brightBlack: '#555555',
  brightRed: '#ef4444',
  brightGreen: '#22c55e',
  brightYellow: '#eab308',
  brightBlue: '#3b82f6',
  brightMagenta: '#a855f7',
  brightCyan: '#06b6d4',
  brightWhite: '#ffffff',
};

export interface TerminalRef {
  write: (data: string) => void;
  writeln: (data: string) => void;
  clear: () => void;
  focus: () => void;
  fit: () => void;
}

interface TerminalComponentProps extends TerminalProps {
  terminalRef?: React.MutableRefObject<TerminalRef | null>;
}

export function Terminal({
  onData,
  onResize,
  hasSession,
  isDark = true,
  terminalRef,
}: TerminalComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const fit = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current) {
      try {
        fitAddonRef.current.fit();
      } catch {
        // Ignore fit errors (container might not be visible)
      }
    }
  }, []);

  // Initialize terminal
  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: isDark ? darkTheme : lightTheme,
      allowTransparency: true,
      scrollback: 10000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(containerRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle terminal input
    terminal.onData((data) => {
      if (hasSession && onData) {
        onData(data);
      }
    });

    // Handle resize
    terminal.onResize(({ cols, rows }) => {
      if (hasSession && onResize) {
        onResize(cols, rows);
      }
    });

    // Handle window resize
    const handleResize = () => fit();
    window.addEventListener('resize', handleResize);

    // Expose methods via ref
    if (terminalRef) {
      terminalRef.current = {
        write: (data: string) => terminal.write(data),
        writeln: (data: string) => terminal.writeln(data),
        clear: () => terminal.clear(),
        focus: () => terminal.focus(),
        fit: () => fit(),
      };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [onData, onResize, hasSession, isDark, terminalRef, fit]);

  // Update theme when it changes
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = isDark ? darkTheme : lightTheme;
    }
  }, [isDark]);

  // Fit terminal when hasSession changes (terminal becomes visible)
  useEffect(() => {
    fit();
  }, [hasSession, fit]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: isDark ? '#1a1a1a' : '#fafafa',
      }}
    />
  );
}
