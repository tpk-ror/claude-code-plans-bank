'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PlanFilters } from '@/lib/types';

interface PlanFiltersProps {
  filters: PlanFilters;
  onFilterChange: (filters: Partial<PlanFilters>) => void;
  className?: string;
}

export function PlanFiltersComponent({
  filters,
  onFilterChange,
  className,
}: PlanFiltersProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search plans..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFilterChange({ status: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) =>
            onFilterChange({ category: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="bugfix">Bugfix</SelectItem>
            <SelectItem value="refactor">Refactor</SelectItem>
            <SelectItem value="docs">Docs</SelectItem>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
