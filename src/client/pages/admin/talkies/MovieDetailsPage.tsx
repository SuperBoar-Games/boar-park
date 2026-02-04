import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AdminLayout } from '../../../components/AdminLayout';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { Select } from '../../../components/Select';
import { Icons } from '../../../components/Icons';
import { Card, Movie, talkiesApi, useTags } from '../../../hooks/useTalkies';

export default function MovieDetailsPage() {
    const { movieId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state as any) || {};
    const heroId = state.heroId;
    const movieTitle = state.movieTitle || 'Movie';
    const initialLocked = state.movieLocked || false;

    const [movie, setMovie] = useState<Movie | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTagsForCard, setEditingTagsForCard] = useState<number | null>(null);
    const [tagSearchTerm, setTagSearchTerm] = useState('');
    const tagInputRef = useRef<HTMLInputElement>(null);

    const { tags } = useTags(heroId ? parseInt(heroId) : undefined);

    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [cardForm, setCardForm] = useState({
        name: '',
        type: '',
        call_sign: '',
        ability_text: '',
        ability_text2: '',
    });

    useEffect(() => {
        const loadData = async () => {
            if (!movieId || !heroId) return;
            try {
                setLoading(true);
                // Get cards for this movie - this also returns movie_title now
                const cardsResponse = await talkiesApi.getCardsByHeroAndMovie(heroId, parseInt(movieId));
                const cardsData = cardsResponse.data || [];
                setCards(cardsData);

                // Get movie title from cards if available, otherwise fetch movies
                if (cardsData.length > 0 && cardsData[0].movie_title) {
                    setMovie({
                        id: parseInt(movieId),
                        hero_id: heroId,
                        title: cardsData[0].movie_title,
                        locked: initialLocked,
                        need_review: false,
                    });
                } else {
                    // Fetch movie details only if cards don't have the title
                    const moviesResponse = await talkiesApi.getMoviesByHeroId(heroId);
                    const foundMovie = moviesResponse.data.find(m => m.id === parseInt(movieId));
                    if (foundMovie) {
                        setMovie(foundMovie);
                    } else {
                        setMovie({
                            id: parseInt(movieId),
                            hero_id: heroId,
                            title: movieTitle,
                            locked: initialLocked,
                            need_review: false,
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to load movie data', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [movieId, heroId, movieTitle, initialLocked]);

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
        const previousCards = cards;
        try {
            if (editingCard) {
                const updatedCard = { ...editingCard, ...cardForm };
                setCards(prev => prev.map(c => c.id === editingCard.id ? updatedCard : c));
                await talkiesApi.updateCard(editingCard.id, {
                    ...cardForm,
                    heroId: movie.hero_id,
                    movieId: movie.id,
                });
            } else {
                const response = await talkiesApi.createCard({
                    ...cardForm,
                    heroId: movie.hero_id,
                    movieId: movie.id,
                });
                if (response.data && response.data.data) {
                    setCards(prev => [...prev, response.data.data]);
                }
            }
            setIsCardModalOpen(false);
        } catch (err) {
            setCards(previousCards);
            alert('Failed to save card');
        }
    };

    const handleDeleteCard = async (card: Card) => {
        if (!confirm(`Delete "${card.name}"?`)) return;
        const previousCards = cards;
        try {
            setCards(prev => prev.filter(c => c.id !== card.id));
            await talkiesApi.deleteCard(card.id);
        } catch (err) {
            setCards(previousCards);
            alert('Failed to delete card');
        }
    };

    const handleToggleCardReview = async (card: Card) => {
        if (movie?.locked) return;
        const previousCards = cards;
        try {
            setCards(prev => prev.map(c =>
                c.id === card.id ? { ...c, need_review: !c.need_review } : c
            ));
            await talkiesApi.updateCard(card.id, { needReview: !card.need_review });
        } catch (err) {
            setCards(previousCards);
            alert('Failed to update card review status');
        }
    };

    const toggleMovieLock = async () => {
        if (!movie) return;
        try {
            await talkiesApi.updateMovieLocked(movie.id, !movie.locked);
            setMovie({ ...movie, locked: !movie.locked });
        } catch (err) {
            alert('Failed to update movie');
        }
    };

    const handleRemoveTag = async (card: Card, tagId: number) => {
        if (movie?.locked) return;
        const previousCards = cards;
        try {
            const currentTagIds = (card.tags || []).map(t => t.id);
            const newTagIds = currentTagIds.filter(id => id !== tagId);
            setCards(prev => prev.map(c =>
                c.id === card.id ? { ...c, tags: c.tags?.filter(t => t.id !== tagId) } : c
            ));
            await talkiesApi.updateCard(card.id, { tagIds: newTagIds });
        } catch (err) {
            setCards(previousCards);
            alert('Failed to remove tag');
        }
    };

    const handleAddTag = async (card: Card, tagId: number) => {
        if (movie?.locked) return;
        const currentTagIds = (card.tags || []).map(t => t.id);
        if (currentTagIds.includes(tagId)) return;

        const previousCards = cards;
        const tagToAdd = tags.find(t => t.id === tagId);
        if (!tagToAdd) return;

        try {
            const newTagIds = [...currentTagIds, tagId];
            setCards(prev => prev.map(c =>
                c.id === card.id ? { ...c, tags: [...(c.tags || []), tagToAdd] } : c
            ));
            await talkiesApi.updateCard(card.id, { tagIds: newTagIds });
            setEditingTagsForCard(null);
            setTagSearchTerm('');
        } catch (err) {
            setCards(previousCards);
            alert('Failed to add tag');
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

    if (loading) return <AdminLayout title={<h1>Movie Details</h1>}><p>Loading...</p></AdminLayout>;
    if (!heroId) return <AdminLayout title={<h1>Movie Details</h1>}><p>Invalid navigation - please navigate from hero details page</p></AdminLayout>;

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
                <button
                    className={`lock-toggle ${movie.locked ? 'locked' : ''}`}
                    onClick={toggleMovieLock}
                    title={movie.locked ? 'Click to unlock' : 'Click to lock'}
                >
                    {movie.locked ? Icons.lock : Icons.unlock}
                    <span>{movie.locked ? 'Locked' : 'Unlocked'}</span>
                </button>
                {!movie.locked && (
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
                                {!movie.locked && (
                                    <div className="card-actions">
                                        <button
                                            onClick={() => handleToggleCardReview(card)}
                                            className={`action-btn ${card.need_review ? 'warning' : ''}`}
                                            title={card.need_review ? 'Mark as reviewed' : 'Mark for review'}
                                        >
                                            {card.need_review ? Icons.flagSolid : Icons.flagRegular}
                                        </button>
                                        <button
                                            onClick={() => openEditCardModal(card)}
                                            className="action-btn edit"
                                            title="Edit"
                                        >
                                            {Icons.edit}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCard(card)}
                                            className="action-btn delete"
                                            title="Delete"
                                        >
                                            {Icons.delete}
                                        </button>
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
                                                    {!movie.locked && (
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
                                    {!movie.locked && (
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
                        <Select
                            value={cardForm.type}
                            onChange={(value) => setCardForm({ ...cardForm, type: value })}
                            options={[
                                { value: '', label: 'Select type...' },
                                { value: 'HERO', label: 'HERO' },
                                { value: 'VILLAIN', label: 'VILLAIN' },
                                { value: 'SR1', label: 'SR1' },
                                { value: 'SR2', label: 'SR2' },
                                { value: 'WC', label: 'WC' },
                            ]}
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
        </AdminLayout>
    );
}
