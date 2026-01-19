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

// Use refs to avoid recreating terminal when callbacks/session state change
function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

// ShadCN-compatible dark theme (zinc palette)
const darkTheme = {
  background: 'hsl(240 10% 3.9%)',
  foreground: 'hsl(0 0% 98%)',
  cursor: 'hsl(0 0% 98%)',
  cursorAccent: 'hsl(240 10% 3.9%)',
  selectionBackground: 'hsla(239 84% 67% / 0.3)',
  black: '#18181b',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  magenta: '#a855f7',
  cyan: '#06b6d4',
  white: '#fafafa',
  brightBlack: '#71717a',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#fbbf24',
  brightBlue: '#60a5fa',
  brightMagenta: '#c084fc',
  brightCyan: '#22d3ee',
  brightWhite: '#ffffff',
};

// ShadCN-compatible light theme (zinc palette)
const lightTheme = {
  background: 'hsl(0 0% 100%)',
  foreground: 'hsl(240 10% 3.9%)',
  cursor: 'hsl(240 10% 3.9%)',
  cursorAccent: 'hsl(0 0% 100%)',
  selectionBackground: 'hsla(239 84% 67% / 0.2)',
  black: '#18181b',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#ca8a04',
  blue: '#2563eb',
  magenta: '#9333ea',
  cyan: '#0891b2',
  white: '#fafafa',
  brightBlack: '#52525b',
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

  // Use refs to avoid recreating terminal when callbacks change
  const onDataRef = useLatestRef(onData);
  const onResizeRef = useLatestRef(onResize);

  const fit = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current && containerRef.current) {
      // Only fit if container has actual dimensions
      if (containerRef.current.offsetHeight > 0 && containerRef.current.offsetWidth > 0) {
        try {
          fitAddonRef.current.fit();
        } catch {
          // Ignore fit errors (container might not be visible)
        }
      }
    }
  }, []);

  // Initialize terminal - only recreate when isDark or terminalRef changes
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

    // Defer fit() to next frame to allow browser to compute container dimensions
    requestAnimationFrame(() => {
      if (containerRef.current && containerRef.current.offsetHeight > 0) {
        try {
          fitAddon.fit();
        } catch {
          // Ignore fit errors during initialization
        }
      }
    });

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle terminal input - always send, server validates session exists
    terminal.onData((data) => {
      if (onDataRef.current) {
        onDataRef.current(data);
      }
    });

    // Handle resize - always send, server validates session exists
    terminal.onResize(({ cols, rows }) => {
      if (onResizeRef.current) {
        onResizeRef.current(cols, rows);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, terminalRef, fit]); // Refs are stable, no need to include them

  // Update theme when it changes
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = isDark ? darkTheme : lightTheme;
    }
  }, [isDark]);

  // Fit terminal when hasSession changes (terminal becomes visible)
  useEffect(() => {
    // Defer to next frame to allow layout recalculation after visibility change
    const frameId = requestAnimationFrame(() => {
      fit();
    });
    return () => cancelAnimationFrame(frameId);
  }, [hasSession, fit]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-none"
      style={{
        background: isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)',
      }}
    />
  );
}
