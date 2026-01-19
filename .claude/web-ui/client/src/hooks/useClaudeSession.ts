import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import type { ConnectionStatus, SessionOptions, SessionExitMessage } from '../lib/types';

interface TerminalMessage {
  id: string;
  content: string;
  timestamp: Date;
}

interface SessionError {
  message: string;
  code?: string;
}

interface ServerInfo {
  terminalMode?: string;
  claudeAvailable?: boolean;
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

  // Error state
  sessionError: SessionError | null;
  clearError: () => void;

  // Server info
  serverInfo: ServerInfo | null;

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
}

export function useClaudeSession(): UseClaudeSessionReturn {
  const ws = useWebSocket();

  const [sessionActive, setSessionActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [messageId, setMessageId] = useState(0);
  const [sessionError, setSessionError] = useState<SessionError | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  // Track session lifecycle events
  useEffect(() => {
    // Handle server connection info
    const unsubServerConnected = ws.on<{ terminalMode?: string; claudeAvailable?: boolean }>(
      'server-connected',
      (data) => {
        setServerInfo({
          terminalMode: data.terminalMode,
          claudeAvailable: data.claudeAvailable,
        });
        console.log('[Session] Server info:', data);
      }
    );

    const unsubCreated = ws.on('session-created', () => {
      setSessionActive(true);
      setIsStarting(false);
      setExitCode(null);
      setSessionError(null);
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

    // Handle session errors
    const unsubError = ws.on<{ error: string; code?: string }>('session-error', (data) => {
      console.error('[Session] Error:', data.error, data.code);
      setSessionError({
        message: data.error,
        code: data.code,
      });
      setIsStarting(false);
      setSessionActive(false);
    });

    return () => {
      unsubServerConnected();
      unsubCreated();
      unsubAttached();
      unsubExit();
      unsubKilled();
      unsubError();
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
    setSessionError(null);
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

  const clearError = useCallback(() => {
    setSessionError(null);
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

    // Error state
    sessionError,
    clearError,

    // Server info
    serverInfo,

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
  };
}
