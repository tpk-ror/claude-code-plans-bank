'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from './use-websocket';
import type { ConnectionStatus, SessionOptions, SessionExitMessage } from '@/lib/types';

interface TerminalMessage {
  id: string;
  content: string;
  timestamp: Date;
}

interface UseClaudeSessionReturn {
  // Connection state
  connectionStatus: ConnectionStatus;
  isConnected: boolean;

  // Session state
  sessionId: string | null;
  sessionActive: boolean;
  isStarting: boolean;
  exitCode: number | null;

  // Terminal messages (for optional chat view)
  messages: TerminalMessage[];

  // Actions
  startSession: (options?: SessionOptions) => void;
  stopSession: () => void;
  sendInput: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  clearMessages: () => void;

  // Event subscription
  onTerminalData: (callback: (data: string) => void) => () => void;

  // WebSocket on function for external use
  wsOn: <T = unknown>(event: string, callback: (data: T) => void) => () => void;
}

export function useClaudeSession(): UseClaudeSessionReturn {
  const ws = useWebSocket();

  const [sessionActive, setSessionActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [messageId, setMessageId] = useState(0);

  // Track session lifecycle events
  useEffect(() => {
    const unsubCreated = ws.on('session-created', () => {
      setSessionActive(true);
      setIsStarting(false);
      setExitCode(null);
    });

    const unsubAttached = ws.on('session-attached', () => {
      setSessionActive(true);
      setIsStarting(false);
    });

    const unsubExit = ws.on<SessionExitMessage>('session-exit', (data) => {
      setSessionActive(false);
      setExitCode(data.exitCode);
    });

    const unsubKilled = ws.on('session-killed', () => {
      setSessionActive(false);
    });

    return () => {
      unsubCreated();
      unsubAttached();
      unsubExit();
      unsubKilled();
    };
  }, [ws]);

  // Track terminal data for chat-like view (optional)
  useEffect(() => {
    const unsub = ws.on<string>('terminal-data', (data) => {
      setMessageId((prev) => prev + 1);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${messageId}`,
          content: data,
          timestamp: new Date(),
        },
      ]);
    });

    return unsub;
  }, [ws, messageId]);

  const startSession = useCallback((options: SessionOptions = {}) => {
    setIsStarting(true);
    setExitCode(null);
    setMessages([]);
    ws.createSession(options);
  }, [ws]);

  const stopSession = useCallback(() => {
    ws.killSession();
    setSessionActive(false);
  }, [ws]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const onTerminalData = useCallback((callback: (data: string) => void) => {
    return ws.on<string>('terminal-data', callback);
  }, [ws]);

  return {
    // Connection state
    connectionStatus: ws.status,
    isConnected: ws.status === 'connected',

    // Session state
    sessionId: ws.sessionId,
    sessionActive,
    isStarting,
    exitCode,

    // Terminal messages
    messages,

    // Actions
    startSession,
    stopSession,
    sendInput: ws.sendInput,
    resize: ws.resize,
    clearMessages,

    // Event subscription
    onTerminalData,

    // WebSocket on function
    wsOn: ws.on,
  };
}
