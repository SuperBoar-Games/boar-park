// Role editor component for creating/editing roles

import { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Modal } from '../Modal';
import type { SystemRole } from '../../hooks/roles/types';

interface RoleEditorProps {
  role?: SystemRole | null;
  onSave: (data: { name: string; description: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RoleEditor({ role, onSave, onCancel, isLoading }: RoleEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={role ? `Edit Role: ${role.name}` : 'Create New Role'}
    >
      <form onSubmit={handleSubmit} className="role-editor-form">
        {/* Basic Info */}
        <div className="form-group">
          <label htmlFor="role-name">Role Name *</label>
          <input
            id="role-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., editor, moderator"
            pattern="[a-z_]{2,50}"
            title="2-50 lowercase letters or underscores"
            required
            disabled={isLoading}
          />
          <small>Lowercase letters and underscores only</small>
        </div>

        <div className="form-group">
          <label htmlFor="role-description">Description</label>
          <textarea
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What can this role do?"
            disabled={isLoading}
          />
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--ctp-overlay2)', marginTop: '1rem' }}>
          Permissions can be assigned in the Permission Matrix below after creating the role.
        </p>

        {/* Actions */}
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !name.trim()}>
            {isLoading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
