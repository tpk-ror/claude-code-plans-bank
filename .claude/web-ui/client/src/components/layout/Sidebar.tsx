import { clsx } from 'clsx';
import type { Plan, PlanFilters } from '../../lib/types';

interface SidebarProps {
  plans: Plan[];
  selectedPlan: Plan | null;
  filters: PlanFilters;
  isCollapsed: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  onSelectPlan: (plan: Plan) => void;
  onFilterChange: (filters: Partial<PlanFilters>) => void;
  onToggle: () => void;
  onSync: () => void;
  onStatusChange: (filename: string, status: Plan['status']) => void;
}

function formatStatus(status: string): string {
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onClick: () => void;
  onStatusClick: (e: React.MouseEvent) => void;
}

function PlanCard({ plan, isSelected, onClick, onStatusClick }: PlanCardProps) {
  const statusClass = plan.status.replace('-', '-');

  return (
    <div
      className={clsx('plan-card', { selected: isSelected })}
      onClick={onClick}
    >
      <div className="plan-card-header">
        <span className={clsx('priority-indicator', plan.priority)} />
        <span className="plan-card-title">{plan.title}</span>
      </div>
      <div className="plan-card-meta">
        <span className="plan-card-category">{plan.category}</span>
        <span
          className={clsx('status-badge', statusClass)}
          onClick={onStatusClick}
        >
          {formatStatus(plan.status)}
        </span>
      </div>
    </div>
  );
}

export function Sidebar({
  plans,
  selectedPlan,
  filters,
  isCollapsed,
  isLoading,
  isSyncing,
  onSelectPlan,
  onFilterChange,
  onToggle,
  onSync,
  onStatusChange,
}: SidebarProps) {
  const handleStatusClick = (e: React.MouseEvent, plan: Plan) => {
    e.stopPropagation();
    // Cycle through statuses
    const statuses: Plan['status'][] = ['pending', 'in-progress', 'completed'];
    const currentIndex = statuses.indexOf(plan.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onStatusChange(plan.filename, nextStatus);
  };

  return (
    <aside className={clsx('sidebar', { collapsed: isCollapsed })}>
      <div className="sidebar-header">
        <h2>Plans</h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="btn btn-sm btn-ghost"
            onClick={onSync}
            title="Sync plans from Claude"
            disabled={isSyncing}
          >
            {isSyncing ? '...' : '↻'}
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={onToggle}
            title="Toggle sidebar"
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>
      </div>

      <div className="filters">
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => onFilterChange({ category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="feature">Feature</option>
          <option value="bugfix">Bugfix</option>
          <option value="refactor">Refactor</option>
          <option value="docs">Docs</option>
          <option value="test">Test</option>
          <option value="chore">Chore</option>
        </select>
        <input
          type="search"
          className="filter-input"
          placeholder="Search plans..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
      </div>

      <div className="plans-list">
        {isLoading ? (
          <div className="plans-loading">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="plans-empty">
            <p>No plans found</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              Create a new plan to get started
            </p>
          </div>
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan.filename}
              plan={plan}
              isSelected={selectedPlan?.filename === plan.filename}
              onClick={() => onSelectPlan(plan)}
              onStatusClick={(e) => handleStatusClick(e, plan)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
