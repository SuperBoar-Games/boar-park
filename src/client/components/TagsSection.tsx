import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { Button } from './Button';
import { Modal } from './Modal';
import type { Tag } from '../hooks/useTalkies';

interface TagsSectionProps {
    heroId: number;
    tags: Tag[];
    onRefresh: () => void;
}

interface TagFormData {
    name: string;
}

export function TagsSection({ heroId, tags, onRefresh }: TagsSectionProps) {
    const [sortKey, setSortKey] = useState<'tag_name' | 'card_count'>('tag_name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState({ tag_name: '', card_count: '' });
    const [showModal, setShowModal] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [formData, setFormData] = useState<TagFormData>({ name: '' });
    const [saving, setSaving] = useState(false);
    const [localTags, setLocalTags] = useState<Tag[]>([]);

    // Sync from props to local state
    useEffect(() => {
        setLocalTags(tags);
    }, [tags]);

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
        setSaving(false);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        setSaving(true);
        const previousTags = localTags;
        try {
            const url = editingTag
                ? `/api/games/talkies/tags/${editingTag.id}`
                : `/api/games/talkies/tags`;

            const response = await fetch(url, {
                method: editingTag ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formData.name.trim() })
            });

            const data = await response.json();
            if (data.success) {
                if (editingTag) {
                    const updatedTag = { ...editingTag, name: formData.name.trim() };
                    setLocalTags(prev => prev.map(t => t.id === editingTag.id ? updatedTag : t));
                } else {
                    // For new tags, add the created tag from response
                    if (data.data) {
                        setLocalTags([...localTags, data.data]);
                    }
                }
                closeModal();
            } else {
                setLocalTags(previousTags);
            }
        } catch (error) {
            setLocalTags(previousTags);
            console.error('Failed to save tag:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (tag: Tag) => {
        if (!confirm(`Delete tag "${tag.name}"?`)) return;

        const previousTags = localTags;
        try {
            setLocalTags(prev => prev.filter(t => t.id !== tag.id));
            const response = await fetch(`/api/games/talkies/tags/${tag.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            if (!data.success) {
                setLocalTags(previousTags);
            }
        } catch (error) {
            setLocalTags(previousTags);
            console.error('Failed to delete tag:', error);
        }
    };

    // Apply filters
    const filteredTags = localTags.filter(tag => {
        const nameMatch = tag.name.toLowerCase().includes(filters.tag_name.toLowerCase());
        const countMatch = String(tag.card_count || 0).includes(filters.card_count);
        return nameMatch && countMatch;
    });

    // Apply sorting
    const sortedTags = [...filteredTags].sort((a, b) => {
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
                <table className="admin-table">
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
                        {sortedTags.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="empty">No tags</td>
                            </tr>
                        ) : (
                            sortedTags.map(tag => (
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
                        <Button variant="primary" onClick={handleSave} disabled={saving || !formData.name.trim()}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button variant="secondary" onClick={closeModal} disabled={saving}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
