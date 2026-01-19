import { useState } from 'react';
import { clsx } from 'clsx';
import type { Plan } from '../../lib/types';

interface PlanDetailProps {
  plan: Plan | null;
  onClose: () => void;
  onStartSession: (plan: Plan) => void;
  onAddNote: (filename: string) => void;
  onArchive: (filename: string) => void;
  onStatusChange: (filename: string, status: Plan['status']) => void;
}

function formatStatus(status: string): string {
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function PlanDetail({
  plan,
  onClose,
  onStartSession,
  onAddNote,
  onArchive,
  onStatusChange,
}: PlanDetailProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (!plan) {
    return (
      <div className="plan-detail-panel collapsed">
        <div className="panel-header">
          <h3 className="panel-title">Select a plan</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="panel-content">
          <p className="empty-state">
            Select a plan from the sidebar to view details
          </p>
        </div>
      </div>
    );
  }

  const statusClass = plan.status;
  const statuses: Plan['status'][] = ['pending', 'in-progress', 'completed'];

  return (
    <div className="plan-detail-panel">
      <div className="panel-header">
        <h3 className="panel-title">{plan.title}</h3>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="panel-content">
        <div className="plan-detail">
          <div className="plan-detail-section">
            <h4>Status</h4>
            <div className="status-dropdown">
              <span
                className={clsx('status-badge', statusClass)}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {formatStatus(plan.status)}
              </span>
              <div
                className={clsx('status-dropdown-menu', { hidden: !showDropdown })}
              >
                {statuses.map((status) => (
                  <button
                    key={status}
                    className="status-dropdown-item"
                    onClick={() => {
                      onStatusChange(plan.filename, status);
                      setShowDropdown(false);
                    }}
                  >
                    {formatStatus(status)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {plan.description && (
            <div className="plan-detail-section">
              <h4>Description</h4>
              <p>{plan.description}</p>
            </div>
          )}

          <div className="plan-detail-section">
            <h4>Info</h4>
            <p>Category: {plan.category}</p>
            <p>Priority: {plan.priority}</p>
            {plan.tags && plan.tags.length > 0 && (
              <p>Tags: {plan.tags.join(', ')}</p>
            )}
          </div>

          <div className="plan-detail-section">
            <h4>Dates</h4>
            <p>Created: {formatDate(plan.createdAt)}</p>
            <p>Updated: {formatDate(plan.updatedAt)}</p>
            {plan.completedAt && (
              <p>Completed: {formatDate(plan.completedAt)}</p>
            )}
          </div>

          <div className="plan-detail-actions">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onStartSession(plan)}
            >
              Start Session
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => onAddNote(plan.filename)}
            >
              Add Note
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                if (window.confirm(`Are you sure you want to archive "${plan.filename}"?`)) {
                  onArchive(plan.filename);
                }
              }}
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
