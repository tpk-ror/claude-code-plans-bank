'use client';

import { Archive, Calendar, Clock, FileText, Tag, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { Plan } from '@/lib/types';

interface PlanDetailSheetProps {
  plan: Plan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: (filename: string, status: Plan['status']) => void;
  onArchive?: (filename: string) => void;
  className?: string;
}

export function PlanDetailSheet({
  plan,
  open,
  onOpenChange,
  onUpdateStatus,
  onArchive,
  className,
}: PlanDetailSheetProps) {
  if (!plan) return null;

  const statusVariant = {
    pending: 'warning',
    'in-progress': 'info',
    completed: 'success',
  } as const;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn('w-[400px] sm:w-[540px]', className)}>
        <SheetHeader>
          <SheetTitle className="text-left">{plan.title}</SheetTitle>
          <SheetDescription className="text-left">
            {plan.filename}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Status
            </label>
            <div className="flex items-center gap-3">
              <Badge variant={statusVariant[plan.status]}>
                {plan.status.replace('-', ' ')}
              </Badge>
              {onUpdateStatus && (
                <Select
                  value={plan.status}
                  onValueChange={(value) =>
                    onUpdateStatus(plan.filename, value as Plan['status'])
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <Separator />

          {/* Metadata Section */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Category:</span>
              <span className="text-sm capitalize">{plan.category}</span>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Priority:</span>
              <Badge
                variant={
                  plan.priority === 'high'
                    ? 'destructive'
                    : plan.priority === 'medium'
                    ? 'warning'
                    : 'secondary'
                }
              >
                {plan.priority}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Created:</span>
              <span className="text-sm">{formatDate(plan.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Updated:</span>
              <span className="text-sm">{formatDate(plan.updatedAt)}</span>
            </div>
            {plan.completedAt && (
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Completed:</span>
                <span className="text-sm">{formatDate(plan.completedAt)}</span>
              </div>
            )}
          </div>

          {/* Description Section */}
          {plan.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="text-sm">{plan.description}</p>
              </div>
            </>
          )}

          {/* Tags Section */}
          {plan.tags && plan.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {plan.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions Section */}
          <Separator />
          <div className="flex justify-end gap-2">
            {onArchive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onArchive(plan.filename);
                  onOpenChange(false);
                }}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
