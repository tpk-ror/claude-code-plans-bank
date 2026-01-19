import { clsx } from 'clsx';
import type { ConnectionStatus } from '../../lib/types';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  isDark: boolean;
  onNewPlan: () => void;
  onToggleTheme: () => void;
}

export function Header({
  connectionStatus,
  isDark,
  onNewPlan,
  onToggleTheme,
}: HeaderProps) {
  const isConnected = connectionStatus === 'connected';

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo">Claude Code Plans</h1>
      </div>
      <div className="header-center">
        <span className="sync-status">
          <span
            className={clsx('status-dot', {
              connected: isConnected,
              disconnected: !isConnected,
            })}
          />
          <span className="status-text">
            {connectionStatus === 'connecting'
              ? 'Connecting...'
              : isConnected
              ? 'Connected'
              : 'Disconnected'}
          </span>
        </span>
      </div>
      <div className="header-right">
        <button className="btn btn-primary" onClick={onNewPlan}>
          <span className="btn-icon">+</span> New Plan
        </button>
        <button
          className="btn btn-icon-only"
          onClick={onToggleTheme}
          title="Toggle theme"
        >
          <span className="theme-icon">{isDark ? '☀' : '☾'}</span>
        </button>
      </div>
    </header>
  );
}
