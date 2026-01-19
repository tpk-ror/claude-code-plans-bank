'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useClaudeSession } from '@/hooks';
import { TerminalHeader } from './terminal-header';
import { TerminalView, TerminalViewRef } from './terminal-view';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface TerminalPanelProps {
  className?: string;
}

export function TerminalPanel({ className }: TerminalPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const terminalRef = useRef<TerminalViewRef>(null);
  const session = useClaudeSession();

  // Listen for terminal data and write to terminal
  useEffect(() => {
    const unsub = session.onTerminalData((data) => {
      terminalRef.current?.write(data);
    });
    return unsub;
  }, [session]);

  // Auto-expand terminal when session starts
  useEffect(() => {
    if (session.sessionActive && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [session.sessionActive, isCollapsed]);

  // Fit terminal after collapse/expand
  useEffect(() => {
    if (!isCollapsed) {
      // Small delay to allow animation to complete
      const timeout = setTimeout(() => {
        terminalRef.current?.fit();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isCollapsed]);

  const handleTerminalData = (data: string) => {
    session.sendInput(data);
  };

  const handleTerminalResize = (cols: number, rows: number) => {
    session.resize(cols, rows);
  };

  const handleClear = () => {
    terminalRef.current?.clear();
  };

  const panelHeight = isMaximized ? 'h-[70vh]' : 'h-[250px]';

  return (
    <div className={cn('border-t border-border', className)}>
      <TerminalHeader
        isCollapsed={isCollapsed}
        isMaximized={isMaximized}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        onToggleMaximize={() => setIsMaximized((prev) => !prev)}
        onClear={handleClear}
      />
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CollapsibleContent>
          <div className={cn('bg-[#1a1a1a] transition-all', panelHeight)}>
            <TerminalView
              ref={terminalRef}
              onData={handleTerminalData}
              onResize={handleTerminalResize}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
