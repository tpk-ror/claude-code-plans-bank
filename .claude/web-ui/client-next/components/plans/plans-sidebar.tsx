'use client';

import { useState } from 'react';
import { FileText, RefreshCw, PanelLeftClose, PanelLeft, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlans, useClaudeSession } from '@/hooks';
import { PlanCard } from './plan-card';
import { PlanFiltersComponent } from './plan-filters';
import { PlanDetailSheet } from './plan-detail-sheet';

interface PlansSidebarProps {
  className?: string;
}

export function PlansSidebar({ className }: PlansSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const session = useClaudeSession();

  const {
    plans,
    selectedPlan,
    filters,
    isLoading,
    error,
    loadPlans,
    selectPlan,
    setFilters,
    updateStatus,
    archivePlan,
    triggerSync,
  } = usePlans(undefined, session.wsOn);

  const handlePlanClick = (plan: typeof selectedPlan) => {
    selectPlan(plan);
    setIsDetailOpen(true);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-border bg-card flex flex-col items-center py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-3"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        <Separator className="w-6" />
        <div className="mt-3 flex flex-col items-center gap-2">
          <div className="text-xs font-medium text-muted-foreground rotate-90 whitespace-nowrap mt-8">
            {plans.length} plans
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'w-72 border-r border-border bg-card flex flex-col',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Plans</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => loadPlans()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCollapsed(true)}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-border">
          <PlanFiltersComponent filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Plans List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoading && plans.length === 0 ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </div>
                ))}
              </>
            ) : error ? (
              <div className="p-4 text-center text-destructive">
                <p className="text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => loadPlans()}
                >
                  Try Again
                </Button>
              </div>
            ) : plans.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No plans found</p>
                <p className="text-xs mt-1">
                  {filters.search || filters.status || filters.category
                    ? 'Try adjusting your filters'
                    : 'Create a plan to get started'}
                </p>
              </div>
            ) : (
              plans.map((plan) => (
                <PlanCard
                  key={plan.filename}
                  plan={plan}
                  isSelected={selectedPlan?.filename === plan.filename}
                  onClick={() => handlePlanClick(plan)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer with stats */}
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{plans.length} plans</span>
            <span>
              {plans.filter((p) => p.status === 'completed').length} completed
            </span>
          </div>
        </div>
      </div>

      {/* Plan Detail Sheet */}
      <PlanDetailSheet
        plan={selectedPlan}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdateStatus={updateStatus}
        onArchive={archivePlan}
      />
    </>
  );
}
