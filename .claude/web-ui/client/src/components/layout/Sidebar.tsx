import { RefreshCw, ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Plan, PlanFilters } from '@/lib/types';

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

function getStatusVariant(status: Plan['status']): 'success' | 'warning' | 'info' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'in-progress':
      return 'info';
    default:
      return 'info';
  }
}

function getPriorityColor(priority: Plan['priority']): string {
  switch (priority) {
    case 'high':
      return 'text-destructive';
    case 'medium':
      return 'text-warning';
    case 'low':
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';
  }
}

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onClick: () => void;
  onStatusClick: (e: React.MouseEvent) => void;
}

function PlanCard({ plan, isSelected, onClick, onStatusClick }: PlanCardProps) {
  return (
    <div
      className={cn(
        'group cursor-pointer rounded-lg border border-border bg-card p-3 transition-all hover:border-muted-foreground/50 hover:bg-accent/50',
        isSelected && 'border-brand bg-accent ring-1 ring-brand'
      )}
      onClick={onClick}
    >
      <div className="mb-2 flex items-start gap-2">
        <Circle
          className={cn('mt-1 h-2 w-2 shrink-0 fill-current', getPriorityColor(plan.priority))}
        />
        <span className="line-clamp-2 flex-1 text-sm font-medium leading-snug">
          {plan.title}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
          {plan.category}
        </span>
        <Badge
          variant={getStatusVariant(plan.status)}
          className="cursor-pointer text-xs"
          onClick={onStatusClick}
        >
          {formatStatus(plan.status)}
        </Badge>
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
    const statuses: Plan['status'][] = ['pending', 'in-progress', 'completed'];
    const currentIndex = statuses.indexOf(plan.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onStatusChange(plan.filename, nextStatus);
  };

  return (
    <aside
      className={cn(
        'flex w-72 shrink-0 flex-col border-r border-border bg-card transition-all duration-200',
        isCollapsed && 'w-0 overflow-hidden border-r-0'
      )}
    >
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <h2 className="text-sm font-semibold">Plans</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onSync}
            disabled={isSyncing}
            title="Sync plans"
          >
            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggle}
            title="Toggle sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => onFilterChange({ status: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => onFilterChange({ category: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="bugfix">Bugfix</SelectItem>
            <SelectItem value="refactor">Refactor</SelectItem>
            <SelectItem value="docs">Docs</SelectItem>
            <SelectItem value="test">Test</SelectItem>
            <SelectItem value="chore">Chore</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="search"
          placeholder="Search plans..."
          className="h-8 text-xs"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
      </div>

      {/* Plans list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-3">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No plans found</p>
              <p className="mt-1 text-xs text-muted-foreground">
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
      </ScrollArea>

      {/* Collapsed state toggle button */}
      {isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-0 top-1/2 z-10 h-8 w-6 -translate-y-1/2 rounded-l-none rounded-r-md border border-l-0 border-border bg-card"
          onClick={onToggle}
          title="Show sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </aside>
  );
}
