'use client';

import { Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Plan } from '@/lib/types';

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export function PlanCard({ plan, isSelected, onClick, className }: PlanCardProps) {
  const statusVariant = {
    pending: 'warning',
    'in-progress': 'info',
    completed: 'success',
  } as const;

  const priorityColors = {
    low: 'bg-muted-foreground',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        'hover:bg-accent hover:border-border',
        isSelected
          ? 'bg-accent border-primary'
          : 'bg-card border-transparent',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'w-2 h-2 mt-2 rounded-full shrink-0',
            priorityColors[plan.priority]
          )}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{plan.title}</h3>
          {plan.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {plan.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={statusVariant[plan.status]} className="text-xs">
              {plan.status.replace('-', ' ')}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              <span className="capitalize">{plan.category}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(plan.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
