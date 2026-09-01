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
import { downloadWithAuth } from '../../../utils/downloadFile';

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
    const [loaded, setLoaded] = useState(false);
    const [lightbox, setLightbox] = useState(false);

    // Reset loaded state if the image URL changes (e.g. after re-upload)
    const prevUrl = useRef<string | undefined>(undefined);
    if (imageFile?.url !== prevUrl.current) {
        prevUrl.current = imageFile?.url;
        if (loaded) setLoaded(false);
    }

    useEffect(() => {
        if (!lightbox) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [lightbox]);

    return (
        <div className="card-flip-image-wrapper">
            {imageFile ? (
                <>
                    {!loaded && (
                        <div className="card-flip-loading">
                            <i className="fa-solid fa-spinner fa-spin" />
                        </div>
                    )}
                    <img
                        src={imageFile.url}
                        alt={card.name}
                        onLoad={() => setLoaded(true)}
                        onClick={() => loaded && setLightbox(true)}
                        style={loaded ? { cursor: 'zoom-in' } : { display: 'none' }}
                    />
                    {lightbox && (
                        <div className="lightbox-overlay" onClick={() => setLightbox(false)}>
                            <button className="lightbox-close" onClick={() => setLightbox(false)}>
                                <i className="fa-solid fa-xmark" />
                            </button>
                            <img
                                src={imageFile.url}
                                alt={card.name}
                                className="lightbox-img"
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    )}
                </>
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
    const [busy, setBusy] = useState(false);
    const [dlToast, setDlToast] = useState<string | null>(null);
    const { accessToken } = useAuth();
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

    const handleDownload = async () => {
        if (!types.size || busy) return;
        setBusy(true);
        const typesParam = Array.from(types).join(',');
        const result = await downloadWithAuth(
            `${API_BASE_URL}/api/movies/${movieId}/download?types=${typesParam}`,
            accessToken,
            `movie-${movieId}-files.zip`,
        );
        setBusy(false);
        if (result.ok) setOpen(false);
        else setDlToast(result.error || 'Download failed');
    };

    return (
        <div className="download-dropdown-wrapper" ref={ref}>
            {dlToast && <Toast message={dlToast} onDismiss={() => setDlToast(null)} />}
            <button
                className="btn btn-secondary"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
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
                        disabled={!types.size || busy}
                        onClick={handleDownload}
                    >
                        {busy
                            ? <><i className="fa-solid fa-spinner fa-spin" /> Preparing…</>
                            : <><i className="fa-solid fa-file-zipper" /> Download ZIP</>}
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
    const heroName = state.heroName || 'Hero';
    const crumbs = [
        { label: 'Admin', to: '/admin' },
        { label: 'Talkies', to: '/admin/games/talkies' },
        { label: heroName, to: `/admin/games/talkies/hero/${heroId}` },
    ];
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

    if (cardsLoading) {
        return (
            <AdminLayout title={<h1>Movie</h1>} breadcrumbs={crumbs}>
                <div className="page-status">Loading cards…</div>
            </AdminLayout>
        );
    }
    if (!heroId || !movieId) {
        return (
            <AdminLayout title={<h1>Movie</h1>}>
                <div className="page-status page-status-error">
                    That movie link is missing a hero or movie id. Open the movie from its hero page.
                </div>
            </AdminLayout>
        );
    }

    const canUploadFiles = canCreate('files');
    const canDeleteFiles = canDelete('files');
    const showFilesSection = canUploadFiles || canDeleteFiles;

    return (
        <AdminLayout
            title={<h1>{movie.title}</h1>}
            breadcrumbs={crumbs}
        >
            <div className="table-controls movie-controls">
                <div className="table-controls-left">
                    {/* Text/Images is a VIEW choice, not a lock — it used to
                        borrow .lock-toggle, so "on" looked identical to a
                        locked movie. It's the same segmented control the hero
                        page uses for Movies/Cards. */}
                    {cards.length > 0 && (
                        <div className="segmented" role="group" aria-label="Card view">
                            <button
                                className={`segmented-option ${!isFlipped ? 'active' : ''}`}
                                aria-pressed={!isFlipped}
                                onClick={() => setIsFlipped(false)}
                            >
                                Text
                            </button>
                            <button
                                className={`segmented-option ${isFlipped ? 'active' : ''}`}
                                aria-pressed={isFlipped}
                                onClick={() => setIsFlipped(true)}
                            >
                                Images
                            </button>
                        </div>
                    )}
                    {canUpdate('movies') && (
                        <button
                            className={`lock-toggle ${movieLocked ? 'locked' : ''}`}
                            aria-pressed={movieLocked}
                            onClick={handleToggleMovieLock}
                            title={movieLocked ? 'Unlock this movie for editing' : 'Lock this movie against edits'}
                        >
                            {movieLocked ? Icons.lock : Icons.unlock}
                            <span>{movieLocked ? 'Locked' : 'Unlocked'}</span>
                        </button>
                    )}
                    {canUpdate('movies') && (
                        <button
                            className={`lock-toggle ${filesLocked ? 'locked' : ''}`}
                            aria-pressed={filesLocked}
                            onClick={handleToggleFilesLock}
                            title={filesLocked ? 'Allow file uploads again' : 'Block new file uploads'}
                        >
                            <i className={filesLocked ? 'fa-solid fa-file-circle-xmark' : 'fa-solid fa-file-circle-check'} />
                            <span>{filesLocked ? 'Files locked' : 'Files open'}</span>
                        </button>
                    )}
                    {!movieLocked && canCreate('cards') && (
                        <Button onClick={openAddCardModal}>
                            {Icons.plus} <span>Add card</span>
                        </Button>
                    )}
                </div>
                <div className="table-controls-right">
                    <DownloadDropdown movieId={movie.id} />
                </div>
            </div>

            <div className="cards-grid">
                {cards.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-block">
                            <p className="empty-title">No cards on this movie yet</p>
                            <p className="empty-hint">Add a card to start building this movie’s deck.</p>
                        </div>
                    </div>
                ) : (
                    cards.map(card => (
                        <div
                            key={card.id}
                            className={`card-item${isFlipped ? ' flipped' : ''}${card.need_review ? ' needs-review' : ''}`}
                        >
                            <div className="card-main">
                            <div className="card-header">
                                <span className="card-type-badge">
                                    {card.type === 'HERO' ? 'H' : card.type === 'VILLAIN' ? 'V' : card.type}
                                </span>
                                <div className="card-identity">
                                    <h3>{card.name}</h3>
                                    {card.call_sign && (
                                        <p className="card-callsign">{card.call_sign}</p>
                                    )}
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
                                {(card.ability_text || card.ability_text2) && (
                                    <ol className="card-abilities">
                                        {card.ability_text && <li>{card.ability_text}</li>}
                                        {card.ability_text2 && <li>{card.ability_text2}</li>}
                                    </ol>
                                )}
                                <div className="card-tags">
                                    <div className="tags-list">
                                        {card.tags && card.tags.length > 0 ? (
                                            card.tags.map(tag => (
                                                <span key={tag.id} className="tag-badge">
                                                    {tag.name}
                                                    {!movieLocked && (
                                                        <button
                                                            type="button"
                                                            className="remove-tag-btn"
                                                            onClick={() => handleRemoveTag(card, tag.id)}
                                                            title={`Remove ${tag.name}`}
                                                            aria-label={`Remove tag ${tag.name}`}
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
                        </div>
                    ))
                )}
            </div>

            {/* Card Modal */}
            <Modal
                isOpen={isCardModalOpen}
                onClose={() => setIsCardModalOpen(false)}
                title={editingCard ? 'Edit card' : 'Add card'}
                maxWidth="800px"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveCard();
                    }}
                    className="modal-form"
                >
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="card-name">Name</label>
                            <input
                                id="card-name"
                                type="text"
                                required
                                placeholder="e.g. Amarendra Baahubali"
                                value={cardForm.name}
                                onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Type</label>
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
                                placeholder="Select a type"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="card-callsign">
                            Call sign <span className="form-optional">Optional</span>
                        </label>
                        <input
                            id="card-callsign"
                            type="text"
                            placeholder="The line this character is known for"
                            value={cardForm.call_sign}
                            onChange={(e) => setCardForm({ ...cardForm, call_sign: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="card-ability-1">
                            Ability 1 <span className="form-optional">Optional</span>
                        </label>
                        <textarea
                            id="card-ability-1"
                            placeholder="What this card does when played"
                            value={cardForm.ability_text}
                            onChange={(e) => setCardForm({ ...cardForm, ability_text: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="card-ability-2">
                            Ability 2 <span className="form-optional">Optional</span>
                        </label>
                        <textarea
                            id="card-ability-2"
                            placeholder="A second ability, if the card has one"
                            value={cardForm.ability_text2}
                            onChange={(e) => setCardForm({ ...cardForm, ability_text2: e.target.value })}
                        />
                    </div>
                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => setIsCardModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingCard ? 'Save changes' : 'Add card'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete card"
                message={`Delete "${deleteConfirm.cardName}"? Its files go with it. This can’	 be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDeleteCard}
                onCancel={handleCancelDelete}
                isDangerous
            />
        </AdminLayout>
    );
}
