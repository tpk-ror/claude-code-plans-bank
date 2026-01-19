import { useState } from 'react';
import { Modal } from './Modal';

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
      alert('Please enter a title');
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
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="planTitle">Title</label>
          <input
            type="text"
            id="planTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Add user authentication"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="planCategory">Category</label>
          <select
            id="planCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="feature">Feature</option>
            <option value="bugfix">Bugfix</option>
            <option value="refactor">Refactor</option>
            <option value="docs">Documentation</option>
            <option value="test">Test</option>
            <option value="chore">Chore</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="planDescription">Description (optional)</label>
          <textarea
            id="planDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of the plan"
          />
        </div>
        <div className="form-group">
          <label htmlFor="planPriority">Priority</label>
          <select
            id="planPriority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create Plan
          </button>
        </div>
      </form>
    </Modal>
  );
}
