// Talkies tags management section for viewing, creating, editing, and deleting tags

import React, { useState, useMemo } from 'react';
import { Icons } from '../Icons';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { ConfirmDialog } from '../ConfirmDialog';
import { DataTable, type Column } from '../DataTable';
import { usePermissionCheck } from '../../hooks/auth/usePermissions';
import { useTagsQuery } from '../../hooks/talkies/useTalkiesQueries';
import {
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} from '../../hooks/talkies/useTalkiesMutations';
import type { Tag } from '../../hooks/talkies/types';

interface TagsSectionProps {
    heroId: number;
}

interface TagFormData {
    name: string;
}

// tag_name / card_count are the sort+filter keys the existing state uses;
// the rendered values come from the Tag record's own fields.
const TAG_COLUMNS: Column<Tag>[] = [
    {
        key: 'tag_name', label: 'Tag', align: 'left', filter: 'text',
        render: tag => tag.name,
    },
    {
        key: 'card_count', label: 'Cards', align: 'center', filter: 'text', width: '9rem',
        render: tag => (
            <span className={tag.card_count ? undefined : 'num-zero'}>
                {tag.card_count || 0}
            </span>
        ),
    },
];

export function TagsSection({ heroId }: TagsSectionProps) {
    // Fetch tags for this hero
    const { canCreate, canUpdate, canDelete } = usePermissionCheck();
    const { data: tags = [] } = useTagsQuery(heroId);
    const createTag = useCreateTagMutation();
    const updateTag = useUpdateTagMutation();
    const deleteTag = useDeleteTagMutation();

    // UI state only
    const [sortKey, setSortKey] = useState<'tag_name' | 'card_count'>('tag_name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState({ tag_name: '', card_count: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [formData, setFormData] = useState<TagFormData>({ name: '' });
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; tagId: number; tagName: string }>({ isOpen: false, tagId: 0, tagName: '' });

    const handleSort = (key: 'tag_name' | 'card_count') => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const handleFilterChange = (key: 'tag_name' | 'card_count', value: string) => {
        setFilters({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        setFilters({ tag_name: '', card_count: '' });
    };

    const openAddModal = () => {
        setEditingTag(null);
        setFormData({ name: '' });
        setShowModal(true);
    };

    const openEditModal = (tag: Tag) => {
        setEditingTag(tag);
        setFormData({ name: tag.name });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTag(null);
        setFormData({ name: '' });
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        try {
            if (editingTag) {
                await updateTag.mutateAsync({ id: editingTag.id, data: { name: formData.name.trim() } });
            } else {
                await createTag.mutateAsync({ name: formData.name.trim(), color: '#ffffff' });
            }
            closeModal();
        } catch (error) {
            console.error('Failed to save tag:', error);
        }
    };

    const handleDelete = (tag: Tag) => {
        setConfirmDialog({ isOpen: true, tagId: tag.id, tagName: tag.name });
    };

    const handleConfirmDelete = () => {
        deleteTag.mutate(confirmDialog.tagId);
        setConfirmDialog({ isOpen: false, tagId: 0, tagName: '' });
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ isOpen: false, tagId: 0, tagName: '' });
    };

    // Derived data with useMemo
    const filteredAndSortedTags = useMemo(() => {
        let filtered = tags.filter(tag => {
            const nameMatch = tag.name.toLowerCase().includes(filters.tag_name.toLowerCase());
            const countMatch = String(tag.card_count || 0).includes(filters.card_count);
            return nameMatch && countMatch;
        });

        filtered.sort((a, b) => {
            let aVal: string | number = sortKey === 'tag_name' ? a.name : (a.card_count || 0);
            let bVal: string | number = sortKey === 'tag_name' ? b.name : (b.card_count || 0);

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDir === 'asc'
                    ? aVal.localeCompare(bVal, undefined, { numeric: true })
                    : bVal.localeCompare(aVal, undefined, { numeric: true });
            } else {
                return sortDir === 'asc'
                    ? (aVal as number) - (bVal as number)
                    : (bVal as number) - (aVal as number);
            }
        });

        return filtered;
    }, [tags, filters, sortKey, sortDir]);


    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    return (
        <>
            <div className="section-separator"></div>
            <h2 className="section-title">Tags</h2>
            <div className="table-controls">
                <div className="table-controls-left">
                    <Button
                        variant="secondary"
                        aria-pressed={showFilters}
                        className={showFilters ? 'is-active' : ''}
                        onClick={() => setShowFilters(v => !v)}
                    >
                        {Icons.filter}
                        <span>Filters</span>
                        {activeFilterCount > 0 && <span className="btn-count">{activeFilterCount}</span>}
                    </Button>
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" onClick={clearFilters}>
                            <span>Clear</span>
                        </Button>
                    )}
                </div>
                {canCreate('tags') && (
                    <Button variant="primary" onClick={openAddModal}>
                        {Icons.plus} <span>Add tag</span>
                    </Button>
                )}
            </div>

            <DataTable
                columns={TAG_COLUMNS}
                rows={filteredAndSortedTags}
                rowKey={tag => tag.id}
                sort={{ key: sortKey, dir: sortDir }}
                onSort={key => handleSort(key as 'tag_name' | 'card_count')}
                showFilters={showFilters}
                filters={filters}
                onFilterChange={(k, v) => handleFilterChange(k as "tag_name" | "card_count", v)}
                empty={
                    <div className="empty-block">
                        <p className="empty-title">
                            {activeFilterCount > 0 ? 'No tags match these filters' : 'No tags yet'}
                        </p>
                        {activeFilterCount === 0 && (
                            <p className="empty-hint">Tags you add can be attached to any card.</p>
                        )}
                    </div>
                }
                actions={tag => (
                    <div className="action-buttons">
                        {canUpdate('tags') && (
                            <button
                                className="action-btn edit"
                                aria-label={`Edit ${tag.name}`}
                                onClick={() => openEditModal(tag)}
                            >
                                {Icons.edit}
                            </button>
                        )}
                        {canDelete('tags') && (
                            <button
                                className="action-btn delete"
                                aria-label={`Delete ${tag.name}`}
                                onClick={() => handleDelete(tag)}
                            >
                                {Icons.delete}
                            </button>
                        )}
                    </div>
                )}
            />

            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingTag ? 'Edit Tag' : 'Add Tag'}
            >
                <div className="modal-form">
                    <div className="form-group">
                        <input
                            id="tag-name"
                            type="text"
                            placeholder="Tag name"
                            value={formData.name}
                            onChange={(e) => setFormData({ name: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') closeModal();
                            }}
                            autoFocus
                        />
                    </div>
                    <div className="form-actions">
                        <Button variant="primary" onClick={handleSave} disabled={!formData.name.trim()}>
                            Save
                        </Button>
                        <Button variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete tag"
                message={`Delete the "${confirmDialog.tagName}" tag? It will be removed from every card using it.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                isDangerous
            />
        </>
    );
}
