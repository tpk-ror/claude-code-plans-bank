import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, WSMessage, SessionOptions } from '../lib/types';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface UseWebSocketReturn {
  status: ConnectionStatus;
  sessionId: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendInput: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  createSession: (options?: SessionOptions) => void;
  killSession: () => void;
  on: <T = unknown>(event: string, callback: (data: T) => void) => () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const listenersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());

  const emit = useCallback((event: string, data?: unknown) => {
    const listeners = listenersRef.current.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in ${event} listener:`, err);
        }
      });
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);
      const { type, ...data } = message;

      switch (type) {
        case 'terminal-data':
          emit('terminal-data', (data as { data: string }).data);
          break;
        case 'session-created':
          setSessionId((data as { sessionId: string }).sessionId);
          emit('session-created', data);
          break;
        case 'session-attached':
          emit('session-attached', data);
          break;
        case 'session-exit':
          emit('session-exit', data);
          break;
        case 'session-killed':
          setSessionId(null);
          emit('session-killed', data);
          break;
        case 'plan-update':
          emit('plan-update', data);
          break;
        case 'plan-sync':
          emit('plan-sync', data);
          break;
        case 'error':
          emit('error', new Error((data as { message: string }).message));
          break;
        default:
          console.log('Unknown message type:', type);
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  }, [emit]);

  const connect = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = sessionId
        ? `${protocol}//${window.location.host}?sessionId=${sessionId}`
        : `${protocol}//${window.location.host}`;

      console.log('[WS] Connecting to:', url);
      setStatus('connecting');

      const ws = new WebSocket(url);
      wsRef.current = ws;

      const timeout = setTimeout(() => {
        console.error('[WS] Connection timeout');
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('[WS] Connected');
        setStatus('connected');
        reconnectCountRef.current = 0;
        emit('connected');
        resolve();
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        console.log('[WS] Closed:', event.code, event.reason);
        setStatus('disconnected');
        emit('disconnected', event);

        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          const delay = reconnectDelay * reconnectCountRef.current;
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current})`);
          setTimeout(() => connect(), delay);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('[WS] Error:', error);
        emit('error', error);
        reject(error);
      };

      ws.onmessage = handleMessage;
    });
  }, [sessionId, reconnectAttempts, reconnectDelay, emit, handleMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((type: string, payload: object = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    wsRef.current.send(JSON.stringify({ type, payload }));
  }, []);

  const sendInput = useCallback((data: string) => {
    send('terminal-input', { data });
  }, [send]);

  const resize = useCallback((cols: number, rows: number) => {
    send('resize', { cols, rows });
  }, [send]);

  const createSession = useCallback((sessionOptions: SessionOptions = {}) => {
    send('create-session', sessionOptions);
  }, [send]);

  const killSession = useCallback(() => {
    send('kill-session');
  }, [send]);

  const on = useCallback(<T = unknown>(event: string, callback: (data: T) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    const typedCallback = callback as (data: unknown) => void;
    listenersRef.current.get(event)!.add(typedCallback);

    return () => {
      listenersRef.current.get(event)?.delete(typedCallback);
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect().catch(console.error);
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    sessionId,
    connect,
    disconnect,
    sendInput,
    resize,
    createSession,
    killSession,
    on,
  };
}
