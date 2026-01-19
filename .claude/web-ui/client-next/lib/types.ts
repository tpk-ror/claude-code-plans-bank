// Plan types
export interface Plan {
  filename: string;
  title: string;
  category: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// WebSocket message types
export type WSMessageType =
  | 'terminal-data'
  | 'session-created'
  | 'session-attached'
  | 'session-exit'
  | 'session-killed'
  | 'plan-update'
  | 'plan-sync'
  | 'error';

export interface WSMessage {
  type: WSMessageType;
  [key: string]: unknown;
}

export interface SessionCreatedMessage {
  type: 'session-created';
  sessionId: string;
}

export interface SessionExitMessage {
  type: 'session-exit';
  exitCode: number;
}

export interface PlanUpdateMessage {
  type: 'plan-update';
  event: 'add' | 'change' | 'unlink';
  filename: string;
}

export interface PlanSyncMessage {
  type: 'plan-sync';
  event: string;
  filename: string;
  status: 'success' | 'error';
}

// Session options
export interface SessionOptions {
  planPath?: string;
}

// Filter state
export interface PlanFilters {
  status: string;
  category: string;
  search: string;
}

// Connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
