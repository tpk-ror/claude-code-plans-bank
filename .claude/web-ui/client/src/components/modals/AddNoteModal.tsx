import { useState, useEffect } from 'react';
import { Modal } from './Modal';

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
      alert('Please enter a note');
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
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="noteContent">Note</label>
          <textarea
            id="noteContent"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Enter your note..."
            autoFocus
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Add Note
          </button>
        </div>
      </form>
    </Modal>
  );
}
