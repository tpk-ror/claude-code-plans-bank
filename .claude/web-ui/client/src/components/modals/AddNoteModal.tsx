import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

interface AddNoteModalProps {
  isOpen: boolean;
  filename: string | null;
  onClose: () => void;
  onSubmit: (filename: string, note: string) => void;
}

export function AddNoteModal({
  isOpen,
  filename,
  onClose,
  onSubmit,
}: AddNoteModalProps) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNote('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      return;
    }
    if (filename) {
      onSubmit(filename, note.trim());
    }
    setNote('');
    onClose();
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Note" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="noteContent" className="text-sm font-medium">
            Note
          </label>
          <Textarea
            id="noteContent"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Enter your note..."
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={!note.trim()}>
            Add Note
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
