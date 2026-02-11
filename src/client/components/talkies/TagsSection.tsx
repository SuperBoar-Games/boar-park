// Talkies tags management section for viewing, creating, editing, and deleting tags

import React, { useState, useMemo } from 'react';
import { Icons } from '../Icons';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { ConfirmDialog } from '../ConfirmDialog';
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

export function TagsSection({ heroId }: TagsSectionProps) {
    // Fetch tags for this hero
    const { data: tags = [] } = useTagsQuery(heroId);
    const createTag = useCreateTagMutation();
    const updateTag = useUpdateTagMutation();
    const deleteTag = useDeleteTagMutation();

    // UI state only
    const [sortKey, setSortKey] = useState<'tag_name' | 'card_count'>('tag_name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState({ tag_name: '', card_count: '' });
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

    const getSortIcon = (key: string) => {
        if (sortKey !== key) return Icons.sort;
        return sortDir === 'asc' ? Icons.sortUp : Icons.sortDown;
    };

    return (
        <>
            <div className="section-separator"></div>
            <h2 className="section-title">Tags</h2>
            <div className="table-controls">
                <Button variant="secondary" onClick={clearFilters}>
                    {Icons.filter} <span>Clear Filters</span>
                </Button>
                <Button variant="primary" onClick={openAddModal}>
                    {Icons.plus} <span>Add Tag</span>
                </Button>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th
                                data-sort="tag_name"
                                className="sortable text-left"
                                onClick={() => handleSort('tag_name')}
                            >
                                <div className="sort-header">
                                    Tag <span>{getSortIcon('tag_name')}</span>
                                </div>
                            </th>
                            <th
                                data-sort="card_count"
                                className="sortable text-center"
                                onClick={() => handleSort('card_count')}
                            >
                                <div className="sort-header">
                                    # Cards <span>{getSortIcon('card_count')}</span>
                                </div>
                            </th>
                            <th className="text-center">Actions</th>
                        </tr>
                        <tr className="filter-row">
                            <td>
                                <input
                                    className="filter-input"
                                    data-filter="tag_name"
                                    placeholder="Filter..."
                                    value={filters.tag_name}
                                    onChange={(e) => handleFilterChange('tag_name', e.target.value)}
                                />
                            </td>
                            <td>
                                <input
                                    className="filter-input"
                                    data-filter="card_count"
                                    placeholder="Filter..."
                                    value={filters.card_count}
                                    onChange={(e) => handleFilterChange('card_count', e.target.value)}
                                />
                            </td>
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedTags.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="empty">No tags</td>
                            </tr>
                        ) : (
                            filteredAndSortedTags.map(tag => (
                                <tr key={tag.id} data-id={tag.id}>
                                    <td>{tag.name}</td>
                                    <td className="text-center">{tag.card_count || 0}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="action-btn edit" onClick={() => openEditModal(tag)}>
                                                {Icons.edit}
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDelete(tag)}>
                                                {Icons.delete}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

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
                title="Delete Tag"
                message={`Are you sure you want to delete "${confirmDialog.tagName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                isDangerous
            />
        </>
    );
}
