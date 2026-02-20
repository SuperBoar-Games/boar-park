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
import { Toast } from '../../../components/Toast';
import { useCardsQuery, useTagsQuery } from '../../../hooks/talkies/useTalkiesQueries';
import {
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useUpdateMovieMutation,
} from '../../../hooks/talkies/useTalkiesMutations';
import { useCardFilesQuery } from '../../../hooks/talkies/useFilesQueries';
import {
  useUploadFileMutation,
  useDeleteFileMutation,
  useToggleFilesLockMutation,
} from '../../../hooks/talkies/useFilesMutations';
import type { Card, Movie, CardFile } from '../../../hooks/talkies/types';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

const FILE_TYPE_LABELS: Record<number, string> = { 1: 'Design', 2: 'Image', 3: 'Print' };
const FILE_TYPE_ACCEPT: Record<number, string> = {
    1: '*/*',
    2: 'image/png,image/jpeg,image/webp',
    3: '*/*',
};

// ---- Per-card file row sub-component ----
function CardFilesSection({
    card,
    filesLocked,
    canUpload,
    canDelete,
}: {
    card: Card;
    filesLocked: boolean;
    canUpload: boolean;
    canDelete: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const { data: files = [] } = useCardFilesQuery(open ? card.id : null);
    const uploadMutation = useUploadFileMutation();
    const deleteMutation = useDeleteFileMutation();
    const uploadInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const fileByType = (type: 1 | 2 | 3): CardFile | undefined =>
        files.find(f => f.file_type === type);

    const handleUpload = async (fileType: 1 | 2 | 3, file: File) => {
        try {
            await uploadMutation.mutateAsync({ cardId: card.id, fileType, file });
        } catch (err) {
            setToast(err instanceof Error ? err.message : 'Upload failed');
        }
    };

    const handleDelete = async (fileType: 1 | 2 | 3) => {
        try {
            await deleteMutation.mutateAsync({ cardId: card.id, fileType });
        } catch (err) {
            setToast(err instanceof Error ? err.message : 'Delete failed');
        }
    };

    const canAct = (canUpload || canDelete) && !filesLocked;

    return (
        <>
        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        <div className="card-files-section">
            <button
                className={`card-files-toggle ${open ? 'open' : ''}`}
                onClick={() => setOpen(!open)}
            >
                <i className="fa-solid fa-chevron-right" />
                Files
                {filesLocked && (
                    <span className="card-files-locked-badge" title="File uploads locked">
                        <i className="fa-solid fa-lock" />
                    </span>
                )}
            </button>

            {open && (
                <div>
                    {([1, 2, 3] as const).map(ft => {
                        const existing = fileByType(ft);
                        const isUploading = uploadMutation.isPending;
                        const isDeleting = deleteMutation.isPending;
                        return (
                            <div key={ft} className="card-file-row">
                                <span className="card-file-label">{FILE_TYPE_LABELS[ft]}</span>
                                <span className={`card-file-name ${existing ? '' : 'empty'}`} title={existing?.original_name}>
                                    {existing ? existing.original_name : (ft === 3 ? '— optional' : '—')}
                                </span>
                                {canAct && (
                                    <div className="card-file-actions">
                                        <button
                                            className="card-file-btn"
                                            title={existing ? 'Replace file' : 'Upload file'}
                                            disabled={isUploading}
                                            onClick={() => uploadInputRefs.current[ft]?.click()}
                                        >
                                            <i className={existing ? 'fa-solid fa-arrow-up-from-bracket' : 'fa-solid fa-upload'} />
                                        </button>
                                        {existing && (
                                            <button
                                                className="card-file-btn delete"
                                                title="Delete file"
                                                disabled={isDeleting}
                                                onClick={() => handleDelete(ft)}
                                            >
                                                <i className="fa-solid fa-trash" />
                                            </button>
                                        )}
                                        <input
                                            ref={el => { uploadInputRefs.current[ft] = el; }}
                                            type="file"
                                            accept={FILE_TYPE_ACCEPT[ft]}
                                            style={{ display: 'none' }}
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) handleUpload(ft, file);
                                                e.target.value = '';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        </>
    );
}

// ---- Flip image sub-component ----
function CardFlipImage({ card }: { card: Card }) {
    const { data: files = [] } = useCardFilesQuery(card.id);
    const imageFile = files.find(f => f.file_type === 2);

    return (
        <div className="card-flip-image-wrapper">
            {imageFile ? (
                <img src={imageFile.url} alt={card.name} loading="lazy" />
            ) : (
                <div className="card-flip-no-image">
                    <i className="fa-regular fa-image" />
                    No image uploaded
                </div>
            )}
        </div>
    );
}

// ---- Download dropdown ----
function DownloadDropdown({ movieId }: { movieId: number }) {
    const [open, setOpen] = useState(false);
    const [types, setTypes] = useState<Set<number>>(new Set([1, 2, 3]));
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const toggleType = (t: number) => {
        setTypes(prev => {
            const next = new Set(prev);
            next.has(t) ? next.delete(t) : next.add(t);
            return next;
        });
    };

    const handleDownload = () => {
        if (!types.size) return;
        const typesParam = Array.from(types).join(',');
        window.location.href = `${API_BASE_URL}/api/movies/${movieId}/download?types=${typesParam}`;
        setOpen(false);
    };

    return (
        <div className="download-dropdown-wrapper" ref={ref}>
            <button
                className="btn btn-secondary"
                onClick={() => setOpen(!open)}
                title="Download files as ZIP"
            >
                <i className="fa-solid fa-download" /> <span>Download</span>
            </button>
            {open && (
                <div className="download-dropdown">
                    <div className="download-dropdown-title">File types</div>
                    {([1, 2, 3] as const).map(ft => (
                        <label key={ft} className="download-type-option">
                            <input
                                type="checkbox"
                                checked={types.has(ft)}
                                onChange={() => toggleType(ft)}
                            />
                            {FILE_TYPE_LABELS[ft]}
                        </label>
                    ))}
                    <button
                        className="download-go-btn"
                        disabled={!types.size}
                        onClick={handleDownload}
                    >
                        <i className="fa-solid fa-file-zipper" /> Download ZIP
                    </button>
                </div>
            )}
        </div>
    );
}

// ---- Main page ----
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
    const toggleFilesLock = useToggleFilesLockMutation();

    // Track movie state locally
    const [movieLocked, setMovieLocked] = useState(initialLocked);
    const [filesLocked, setFilesLocked] = useState(false);

    // Flip view state
    const [isFlipped, setIsFlipped] = useState(false);

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
            files_locked: filesLocked,
            need_review: false,
        } as Movie;
    }, [cards, movieId, heroId, movieTitle, initialLocked, filesLocked]);

    const openAddCardModal = () => {
        setEditingCard(null);
        setCardForm({ name: '', type: '', call_sign: '', ability_text: '', ability_text2: '' });
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
        if (currentTagIds.includes(tagId)) return;
        const tagToAdd = tags.find(t => t.id === tagId);
        if (!tagToAdd) return;
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
            await updateMovie.mutateAsync({ id: movie.id, data: { locked: !movieLocked } });
            setMovieLocked(!movieLocked);
        } catch (err) {
            alert('Failed to toggle movie lock');
        }
    };

    const handleToggleFilesLock = async () => {
        try {
            await toggleFilesLock.mutateAsync({ movieId: movie.id, heroId: parseInt(heroId!) });
            setFilesLocked(!filesLocked);
        } catch (err) {
            alert('Failed to toggle files lock');
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

    const canUploadFiles = canCreate('files');
    const canDeleteFiles = canDelete('files');
    const showFilesSection = canUploadFiles || canDeleteFiles;

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
                        title={movieLocked ? 'Click to unlock content' : 'Click to lock content'}
                    >
                        {movieLocked ? Icons.lock : Icons.unlock}
                        <span>{movieLocked ? 'Locked' : 'Unlocked'}</span>
                    </button>
                )}
                {canUpdate('movies') && (
                    <button
                        className={`lock-toggle ${filesLocked ? 'locked' : ''}`}
                        onClick={handleToggleFilesLock}
                        title={filesLocked ? 'Click to unlock file uploads' : 'Click to lock file uploads'}
                    >
                        <i className={filesLocked ? 'fa-solid fa-file-circle-xmark' : 'fa-solid fa-file-circle-check'} />
                        <span>{filesLocked ? 'Files Locked' : 'Files Open'}</span>
                    </button>
                )}
                {/* Flip view toggle */}
                {cards.length > 0 && (
                    <button
                        className={`lock-toggle ${isFlipped ? 'locked' : ''}`}
                        onClick={() => setIsFlipped(!isFlipped)}
                        title={isFlipped ? 'Show card text' : 'Show card images'}
                    >
                        <i className="fa-solid fa-rotate" />
                        <span>{isFlipped ? 'Text' : 'Images'}</span>
                    </button>
                )}
                {/* Download ZIP */}
                <DownloadDropdown movieId={movie.id} />
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
                        <div key={card.id} className={`card-item ${isFlipped ? 'flipped' : ''}`}>
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

                            {/* Normal text view */}
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

                            {/* Flip image view */}
                            <CardFlipImage card={card} />

                            {/* Files section (always visible, collapses inside) */}
                            {showFilesSection && (
                                <CardFilesSection
                                    card={card}
                                    filesLocked={filesLocked}
                                    canUpload={canUploadFiles}
                                    canDelete={canDeleteFiles}
                                />
                            )}
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
                        <label>Name *</label>
                        <input
                            type="text"
                            required
                            value={cardForm.name}
                            onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Type *</label>
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
                        <label>Call Sign</label>
                        <input
                            type="text"
                            value={cardForm.call_sign}
                            onChange={(e) => setCardForm({ ...cardForm, call_sign: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Ability 1</label>
                        <textarea
                            value={cardForm.ability_text}
                            onChange={(e) => setCardForm({ ...cardForm, ability_text: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Ability 2</label>
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
