// Movie details page for managing cards within a specific movie

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermissionCheck } from '../../../hooks/auth/usePermissions';
import { AdminLayout } from '../../../components/AdminLayout';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Dropdown } from '../../../components/Dropdown';
import { Icons } from '../../../components/Icons';
import { useCardsQuery, useTagsQuery } from '../../../hooks/talkies/useTalkiesQueries';
import {
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useUpdateMovieMutation,
} from '../../../hooks/talkies/useTalkiesMutations';
import type { Card, Movie } from '../../../hooks/talkies/types';

export default function MovieDetailsPage() {
    const { heroId, movieId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { canCreate, canUpdate, canDelete } = usePermissionCheck();
    const state = (location.state as any) || {};
    const movieTitle = state.movieTitle || 'Movie';
    const initialLocked = state.movieLocked || false;

    // Fetch data from React Query
    const { data: cards = [], isLoading: cardsLoading } = useCardsQuery(heroId ? parseInt(heroId) : null, parseInt(movieId!));
    const { data: tags = [] } = useTagsQuery(heroId ? parseInt(heroId) : undefined);

    // Card mutations
    const createCard = useCreateCardMutation();
    const updateCard = useUpdateCardMutation();
    const deleteCard = useDeleteCardMutation();
    const updateMovie = useUpdateMovieMutation();

    // Track movie state locally
    const [movieLocked, setMovieLocked] = useState(initialLocked);

    // UI state only
    const [editingTagsForCard, setEditingTagsForCard] = useState<number | null>(null);
    const [tagSearchTerm, setTagSearchTerm] = useState('');
    const tagInputRef = useRef<HTMLInputElement>(null);

    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [cardForm, setCardForm] = useState({
        name: '',
        type: '',
        call_sign: '',
        ability_text: '',
        ability_text2: '',
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; cardId: number; cardName: string }>({ isOpen: false, cardId: 0, cardName: '' });

    // Create movie object from state and cards data
    const movie = useMemo<Movie>(() => {
        const movieFromCards = cards.length > 0 && cards[0].movie_title
            ? { title: cards[0].movie_title }
            : { title: movieTitle };

        return {
            id: parseInt(movieId!),
            hero_id: heroId,
            title: movieFromCards.title,
            locked: initialLocked,
            need_review: false,
        } as Movie;
    }, [cards, movieId, heroId, movieTitle, initialLocked]);

    const openAddCardModal = () => {
        setEditingCard(null);
        setCardForm({
            name: '',
            type: '',
            call_sign: '',
            ability_text: '',
            ability_text2: '',
        });
        setIsCardModalOpen(true);
    };

    const openEditCardModal = (card: Card) => {
        setEditingCard(card);
        setCardForm({
            name: card.name,
            type: card.type,
            call_sign: card.call_sign || '',
            ability_text: card.ability_text || '',
            ability_text2: card.ability_text2 || '',
        });
        setIsCardModalOpen(true);
    };

    const handleSaveCard = async () => {
        if (!movie) return;
        try {
            const currentUser = user?.username || 'admin';
            if (editingCard) {
                await updateCard.mutateAsync({
                    id: editingCard.id,
                    data: { ...cardForm, hero_id: movie.hero_id, movie_id: movie.id, user: currentUser },
                });
            } else {
                await createCard.mutateAsync({ ...cardForm, hero_id: movie.hero_id, movie_id: movie.id, user: currentUser });
            }
            setIsCardModalOpen(false);
        } catch (err) {
            alert('Failed to save card');
        }
    };

    const handleDeleteCard = (card: Card) => {
        setDeleteConfirm({ isOpen: true, cardId: card.id, cardName: card.name });
    };

    const handleConfirmDeleteCard = () => {
        deleteCard.mutate({ id: deleteConfirm.cardId, heroId: movie.hero_id });
        setDeleteConfirm({ isOpen: false, cardId: 0, cardName: '' });
    };

    const handleCancelDelete = () => {
        setDeleteConfirm({ isOpen: false, cardId: 0, cardName: '' });
    };

    const handleToggleCardReview = async (card: Card) => {
        if (movieLocked) return;
        try {
            await updateCard.mutateAsync({ id: card.id, data: { need_review: !card.need_review } });
        } catch (err) {
            alert('Failed to update card review status');
        }
    };

    const handleRemoveTag = (card: Card, tagId: number) => {
        if (movieLocked) return;
        const currentTagIds = (card.tags || []).map(t => t.id);
        const newTagIds = currentTagIds.filter(id => id !== tagId);
        updateCard.mutateAsync({ id: card.id, data: { tag_ids: newTagIds } });
    };

    const handleAddTag = async (card: Card, tagId: number) => {
        if (movieLocked) return;
        const currentTagIds = (card.tags || []).map(t => t.id);
        if (currentTagIds.includes(tagId)) {
            return;
        }

        const tagToAdd = tags.find(t => t.id === tagId);
        if (!tagToAdd) {
            return;
        }

        try {
            const newTagIds = [...currentTagIds, tagId];
            await updateCard.mutateAsync({ id: card.id, data: { tag_ids: newTagIds } });
            setEditingTagsForCard(null);
            setTagSearchTerm('');
        } catch (err) {
            alert(`Failed to add tag: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const openTagEditor = (cardId: number) => {
        setEditingTagsForCard(cardId);
        setTagSearchTerm('');
        setTimeout(() => tagInputRef.current?.focus(), 0);
    };

    const closeTagEditor = () => {
        setEditingTagsForCard(null);
        setTagSearchTerm('');
    };

    const handleToggleMovieLock = async () => {
        try {
            await updateMovie.mutateAsync({
                id: movie.id,
                data: { locked: !movieLocked },
            });
            setMovieLocked(!movieLocked);
        } catch (err) {
            alert('Failed to toggle movie lock');
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (editingTagsForCard !== null) {
                const target = e.target as HTMLElement;
                if (!target.closest('.tag-editor-dropdown') && !target.closest('.add-tag-btn')) {
                    closeTagEditor();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editingTagsForCard]);

    if (cardsLoading) return <AdminLayout title={<h1>Movie Details</h1>}><p>Loading...</p></AdminLayout>;
    if (!heroId || !movieId) return <AdminLayout title={<h1>Movie Details</h1>}><p>Invalid movie or hero ID</p></AdminLayout>;

    return (
        <AdminLayout
            title={<h1>{movie.title}</h1>}
            actions={
                <Button variant="secondary" onClick={() => navigate(`/admin/games/talkies/hero/${movie.hero_id}`)}>
                    {Icons.arrowLeft} <span>Back to Hero</span>
                </Button>
            }
        >
            <div className="movie-controls">
                {canUpdate('movies') && (
                    <button
                        className={`lock-toggle ${movieLocked ? 'locked' : ''}`}
                        onClick={handleToggleMovieLock}
                        title={movieLocked ? 'Click to unlock' : 'Click to lock'}
                    >
                        {movieLocked ? Icons.lock : Icons.unlock}
                        <span>{movieLocked ? 'Locked' : 'Unlocked'}</span>
                    </button>
                )}
                {!movieLocked && canCreate('cards') && (
                    <Button onClick={openAddCardModal}>
                        {Icons.plus} <span>Add Card</span>
                    </Button>
                )}
            </div>

            <div className="cards-grid">
                {cards.length === 0 ? (
                    <div className="empty-state">
                        <p>No cards found for this movie.</p>
                    </div>
                ) : (
                    cards.map(card => (
                        <div key={card.id} className="card-item">
                            <div className="card-header">
                                <div className="card-title-row">
                                    <span className="card-type-badge">
                                        {card.type === 'HERO' ? 'H' : card.type === 'VILLAIN' ? 'V' : card.type}
                                    </span>
                                    <h3>{card.name}</h3>
                                </div>
                                {!movieLocked && (
                                    <div className="card-actions">
                                        {canUpdate('cards') && (
                                            <button
                                                onClick={() => handleToggleCardReview(card)}
                                                className={`action-btn ${card.need_review ? 'warning' : ''}`}
                                                title={card.need_review ? 'Mark as reviewed' : 'Mark for review'}
                                            >
                                                {card.need_review ? Icons.flagSolid : Icons.flagRegular}
                                            </button>
                                        )}
                                        {canUpdate('cards') && (
                                            <button
                                                onClick={() => openEditCardModal(card)}
                                                className="action-btn edit"
                                                title="Edit"
                                            >
                                                {Icons.edit}
                                            </button>
                                        )}
                                        {canDelete('cards') && (
                                            <button
                                                onClick={() => handleDeleteCard(card)}
                                                className="action-btn delete"
                                                title="Delete"
                                            >
                                                {Icons.delete}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="card-body">
                                {card.call_sign && (
                                    <div className="card-field">
                                        <span className="field-label">Call Sign:</span>
                                        <span className="field-value">{card.call_sign}</span>
                                    </div>
                                )}
                                {card.ability_text && (
                                    <div className="card-field">
                                        <span className="field-label">Ability 1:</span>
                                        <span className="field-value">{card.ability_text}</span>
                                    </div>
                                )}
                                {card.ability_text2 && (
                                    <div className="card-field">
                                        <span className="field-label">Ability 2:</span>
                                        <span className="field-value">{card.ability_text2}</span>
                                    </div>
                                )}
                                <div className="card-tags">
                                    <div className="tags-list">
                                        {card.tags && card.tags.length > 0 ? (
                                            card.tags.map(tag => (
                                                <span key={tag.id} className="tag-badge">
                                                    {tag.name}
                                                    {!movieLocked && (
                                                        <button
                                                            className="remove-tag-btn"
                                                            onClick={() => handleRemoveTag(card, tag.id)}
                                                            title="Remove tag"
                                                        >
                                                            {Icons.x}
                                                        </button>
                                                    )}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="tag-badge muted">No tags</span>
                                        )}
                                    </div>
                                    {!movieLocked && (
                                        <div className="tag-editor-container">
                                            <button
                                                className="add-tag-btn"
                                                onClick={() => openTagEditor(card.id)}
                                            >
                                                Add Tag
                                            </button>
                                            {editingTagsForCard === card.id && (
                                                <div className="tag-editor-dropdown">
                                                    <input
                                                        ref={tagInputRef}
                                                        type="text"
                                                        className="tag-search-input"
                                                        placeholder="Search tags..."
                                                        value={tagSearchTerm}
                                                        onChange={(e) => setTagSearchTerm(e.target.value)}
                                                    />
                                                    <div className="tag-suggestions">
                                                        {tags
                                                            .filter(t => {
                                                                const usedIds = (card.tags || []).map(ct => ct.id);
                                                                return !usedIds.includes(t.id) &&
                                                                    t.name.toLowerCase().includes(tagSearchTerm.toLowerCase());
                                                            })
                                                            .slice(0, 6)
                                                            .map(tag => (
                                                                <div
                                                                    key={tag.id}
                                                                    className="tag-suggestion-item"
                                                                    onClick={() => handleAddTag(card, tag.id)}
                                                                >
                                                                    {tag.name}
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Card Modal */}
            <Modal
                isOpen={isCardModalOpen}
                onClose={() => setIsCardModalOpen(false)}
                title={editingCard ? 'Edit Card' : 'Add Card'}
                maxWidth="800px"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveCard();
                    }}
                    className="modal-form"
                >
                    <div className="form-group">
                        <label>
                            Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={cardForm.name}
                            onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            Type *
                        </label>
                        <Dropdown
                            value={cardForm.type}
                            onChange={(value) => setCardForm({ ...cardForm, type: String(value) })}
                            options={[
                                { id: 'HERO', name: 'HERO' },
                                { id: 'VILLAIN', name: 'VILLAIN' },
                                { id: 'SR1', name: 'SR1' },
                                { id: 'SR2', name: 'SR2' },
                                { id: 'WC', name: 'WC' },
                            ]}
                            placeholder="Select type..."
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            Call Sign
                        </label>
                        <input
                            type="text"
                            value={cardForm.call_sign}
                            onChange={(e) => setCardForm({ ...cardForm, call_sign: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            Ability 1
                        </label>
                        <textarea
                            value={cardForm.ability_text}
                            onChange={(e) => setCardForm({ ...cardForm, ability_text: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            Ability 2
                        </label>
                        <textarea
                            value={cardForm.ability_text2}
                            onChange={(e) => setCardForm({ ...cardForm, ability_text2: e.target.value })}
                        />
                    </div>
                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => setIsCardModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingCard ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Card"
                message={`Are you sure you want to delete "${deleteConfirm.cardName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDeleteCard}
                onCancel={handleCancelDelete}
                isDangerous
            />
        </AdminLayout>
    );
}
