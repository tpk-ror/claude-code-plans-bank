import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    category: string;
    description: string;
    priority: string;
  }) => void;
}

export function NewPlanModal({ isOpen, onClose, onSubmit }: NewPlanModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('feature');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }
    onSubmit({ title: title.trim(), category, description: description.trim(), priority });
    setTitle('');
    setDescription('');
    setCategory('feature');
    setPriority('medium');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setCategory('feature');
    setPriority('medium');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Plan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="planTitle" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="planTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Add user authentication"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="planCategory" className="text-sm font-medium">
            Category
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="bugfix">Bugfix</SelectItem>
              <SelectItem value="refactor">Refactor</SelectItem>
              <SelectItem value="docs">Documentation</SelectItem>
              <SelectItem value="test">Test</SelectItem>
              <SelectItem value="chore">Chore</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="planDescription" className="text-sm font-medium">
            Description <span className="text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="planDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of the plan"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="planPriority" className="text-sm font-medium">
            Priority
          </label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={!title.trim()}>
            Create Plan
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
