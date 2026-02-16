// Hero details page for managing movies and cards for a specific hero

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermissionCheck } from '../../../hooks/auth/usePermissions';
import { AdminLayout } from '../../../components/AdminLayout';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Icons } from '../../../components/Icons';
import { TagsSection } from '../../../components/talkies/TagsSection';
import { Dropdown } from '../../../components/Dropdown';
import { useMoviesQuery, useCardsQuery } from '../../../hooks/talkies/useTalkiesQueries';
import {
  useCreateMovieMutation,
  useUpdateMovieMutation,
  useDeleteMovieMutation,
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
} from '../../../hooks/talkies/useTalkiesMutations';
import type { Movie, Card } from '../../../hooks/talkies/types';
import { exportHeroToCSV } from '../../../utils/csvExport';

type MovieSortKey = 'title' | 'total_cards' | 'review_cards' | 'done';
type CardSortKey = 'movie_title' | 'name' | 'type' | 'call_sign';
type ViewMode = 'movies' | 'cards';

const isValidViewMode = (value: unknown): value is ViewMode => {
    return value === 'movies' || value === 'cards';
};

export default function HeroDetailsPage() {
    const { heroId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { canCreate, canUpdate, canDelete } = usePermissionCheck();
    const [heroName, setHeroName] = useState((location.state as any)?.heroName || `Hero #${heroId}`);
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        const saved = localStorage.getItem('hero.viewMode');
        return isValidViewMode(saved) ? saved : 'movies';
    });

    // Fetch data from React Query
    const { data: movies = [], isLoading: moviesLoading } = useMoviesQuery(parseInt(heroId!));
    const { data: cards = [], isLoading: cardsLoading } = useCardsQuery(parseInt(heroId!));

    // Movie mutations
    const createMovie = useCreateMovieMutation();
    const updateMovie = useUpdateMovieMutation();
    const deleteMovie = useDeleteMovieMutation();

    // Card mutations
    const createCard = useCreateCardMutation();
    const updateCard = useUpdateCardMutation();
    const deleteCard = useDeleteCardMutation();

    // Update hero name from first movie
    if (movies.length > 0 && movies[0].hero_name && heroName.startsWith('Hero #')) {
        setHeroName(movies[0].hero_name);
    }

    // Sorting state
    const [movieSort, setMovieSort] = useState<{ key: MovieSortKey; dir: 'asc' | 'desc' }>({
        key: 'title',
        dir: 'asc',
    });
    const [cardSort, setCardSort] = useState<{ key: CardSortKey; dir: 'asc' | 'desc' }>({
        key: 'movie_title',
        dir: 'asc',
    });

    // Filter state
    const [movieFilters, setMovieFilters] = useState({
        title: '',
        total_cards: '',
        review_cards: '',
        done: '',
    });
    const [cardFilters, setCardFilters] = useState({
        movie_title: '',
        name: '',
        type: '',
        call_sign: '',
        ability1: '',
        ability2: '',
    });

    const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [movieForm, setMovieForm] = useState({ title: '' });
    const [cardForm, setCardForm] = useState({
        name: '',
        type: '',
        call_sign: '',
        ability1: '',
        ability2: '',
        movie_id: 0,
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'movie' | 'card'; id: number; name: string }>({ isOpen: false, type: 'movie', id: 0, name: '' });

    // Filtered and sorted movies
    const filteredMovies = useMemo(() => {
        let filtered = movies.filter(movie => {
            return Object.entries(movieFilters).every(([key, value]) => {
                if (!value) return true;
                if (key === 'done') {
                    if (value === 'done') return movie.done === true;
                    if (value === 'pending') return movie.done === false;
                }
                const movieValue = String(movie[key as keyof Movie] || '').toLowerCase();
                return movieValue.includes(value.toLowerCase());
            });
        });

        filtered.sort((a, b) => {
            const { key, dir } = movieSort;
            let valA = a[key];
            let valB = b[key];

            if (key === 'done') {
                valA = valA ? 1 : 0;
                valB = valB ? 1 : 0;
            }

            if (typeof valA === 'number' && typeof valB === 'number') {
                return dir === 'asc' ? valA - valB : valB - valA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            return dir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });

        return filtered;
    }, [movies, movieFilters, movieSort]);

    // Filtered and sorted cards
    const filteredCards = useMemo(() => {
        let filtered = cards.filter(card => {
            return Object.entries(cardFilters).every(([key, value]) => {
                if (!value) return true;
                const cardValue = String(card[key as keyof Card] || '').toLowerCase();
                return cardValue.includes(value.toLowerCase());
            });
        });

        filtered.sort((a, b) => {
            const { key, dir } = cardSort;
            let valA = a[key] || '';
            let valB = b[key] || '';

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            return dir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });

        return filtered;
    }, [cards, cardFilters, cardSort]);

    const handleMovieSort = (key: MovieSortKey) => {
        setMovieSort(prev => ({
            key,
            dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleCardSort = (key: CardSortKey) => {
        setCardSort(prev => ({
            key,
            dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleMovieFilterChange = (key: string, value: string) => {
        setMovieFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleCardFilterChange = (key: string, value: string) => {
        setCardFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setMovieFilters({ title: '', total_cards: '', review_cards: '', done: '' });
        setCardFilters({ movie_title: '', name: '', type: '', call_sign: '', ability1: '', ability2: '' });
    };

    const renderSortIcon = (currentKey: string, sortKey: string, sortDir: 'asc' | 'desc') => {
        if (currentKey !== sortKey) return Icons.sort;
        return sortDir === 'asc' ? Icons.sortUp : Icons.sortDown;
    };

    const changeViewMode = (mode: 'movies' | 'cards') => {
        setViewMode(mode);
        localStorage.setItem('hero.viewMode', mode);
    };

    const handleExportCSV = () => {
        try {
            const exportData = {
                heroName,
                cards: cards.map(card => ({
                    movie: card.movie_title || '',
                    card_name: card.name || '',
                    card_type: card.type || '',
                    call_sign: card.call_sign || '',
                    ability_text: card.ability_text || '',
                    ability_text2: card.ability_text2 || '',
                })),
            };
            exportHeroToCSV(exportData);
        } catch (err) {
            alert('Failed to export data');
            console.error(err);
        }
    };

    const openAddMovieModal = () => {
        setEditingMovie(null);
        setMovieForm({ title: '' });
        setIsMovieModalOpen(true);
    };

    const openEditMovieModal = (movie: Movie) => {
        setEditingMovie(movie);
        setMovieForm({ title: movie.title });
        setIsMovieModalOpen(true);
    };

    const handleSaveMovie = async () => {
        try {
            const currentUser = user?.username || 'admin';
            if (editingMovie) {
                await updateMovie.mutateAsync({ id: editingMovie.id, data: { title: movieForm.title } });
            } else {
                await createMovie.mutateAsync({ title: movieForm.title, heroId: parseInt(heroId!), user: currentUser });
            }
            setIsMovieModalOpen(false);
        } catch (err) {
            alert('Failed to save movie');
        }
    };

    const handleDeleteMovie = (movie: Movie) => {
        setDeleteConfirm({ isOpen: true, type: 'movie', id: movie.id, name: movie.title });
    };

    const handleConfirmDeleteMovie = () => {
        deleteMovie.mutate({ id: deleteConfirm.id, heroId: parseInt(heroId!) });
        setDeleteConfirm({ isOpen: false, type: 'movie', id: 0, name: '' });
    };

    const toggleMovieLock = (movie: Movie) => {
        // Fire-and-forget: React Query handles the request + auto-refetch on success
        updateMovie.mutate({ id: movie.id, data: { locked: !movie.locked } });
    };

    const toggleMovieReview = (movie: Movie) => {
        // Fire-and-forget: React Query handles the request + auto-refetch on success
        updateMovie.mutate({ id: movie.id, data: { needReview: !movie.need_review } });
    };

    const toggleCardReview = async (card: Card) => {
        try {
            await updateCard.mutateAsync({ id: card.id, data: { need_review: !card.need_review } });
        } catch (err) {
            alert('Failed to update card');
        }
    };

    const openAddCardModal = () => {
        setEditingCard(null);
        setCardForm({
            name: '',
            type: '',
            call_sign: '',
            ability1: '',
            ability2: '',
            movie_id: 0,
        });
        setIsCardModalOpen(true);
    };

    const openEditCardModal = (card: Card) => {
        setEditingCard(card);
        setCardForm({
            name: card.name,
            type: card.type,
            call_sign: card.call_sign || '',
            ability1: card.ability1 || '',
            ability2: card.ability2 || '',
            movie_id: card.movie_id,
        });
        setIsCardModalOpen(true);
    };

    const handleSaveCard = async () => {
        try {
            if (editingCard) {
                await updateCard.mutateAsync({ id: editingCard.id, data: { ...cardForm, heroId: parseInt(heroId!) } });
            } else {
                await createCard.mutateAsync({ ...cardForm, heroId: parseInt(heroId!) });
            }
            setIsCardModalOpen(false);
        } catch (err) {
            alert('Failed to save card');
        }
    };

    const handleDeleteCard = (card: Card) => {
        setDeleteConfirm({ isOpen: true, type: 'card', id: card.id, name: card.name });
    };

    const handleConfirmDeleteCard = () => {
        deleteCard.mutate({ id: deleteConfirm.id, heroId: parseInt(heroId!) });
        setDeleteConfirm({ isOpen: false, type: 'movie', id: 0, name: '' });
    };

    const handleCancelDelete = () => {
        setDeleteConfirm({ isOpen: false, type: 'movie', id: 0, name: '' });
    };

    if (moviesLoading || cardsLoading) return <AdminLayout title={<h1>{heroName}</h1>}><p>Loading...</p></AdminLayout>;

    return (
        <AdminLayout
            title={<h1>{heroName}</h1>}
            actions={
                <Button variant="secondary" onClick={() => navigate('/admin/games/talkies')}>
                    {Icons.arrowLeft} <span>Back to Heroes</span>
                </Button>
            }
        >
            <div className="table-controls">
                <div className="table-controls-left">
                    <Button variant="secondary" onClick={clearFilters}>
                        {Icons.filter} <span>Clear Filters</span>
                    </Button>
                    <Button variant="secondary" onClick={() => changeViewMode(viewMode === 'movies' ? 'cards' : 'movies')}>
                        {Icons.toggle} <span>{viewMode === 'movies' ? 'View Cards' : 'View Movies'}</span>
                    </Button>
                    {viewMode === 'movies' ? (
                        canCreate('movies') && (
                            <Button onClick={openAddMovieModal}>
                                {Icons.plus} <span>Add Movie</span>
                            </Button>
                        )
                    ) : (
                        canCreate('cards') && (
                            <Button onClick={openAddCardModal}>
                                {Icons.plus} <span>Add Card</span>
                            </Button>
                        )
                    )}
                </div>
                <Button variant="secondary" onClick={handleExportCSV}>
                    {Icons.download} <span>Export CSV</span>
                </Button>
            </div>

            {viewMode === 'movies' ? (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {[
                                    { label: 'Title', key: 'title' as MovieSortKey, align: 'text-left' },
                                    { label: 'Cards', key: 'total_cards' as MovieSortKey, align: 'text-center' },
                                    { label: 'To Review', key: 'review_cards' as MovieSortKey, align: 'text-center' },
                                    { label: 'Status', key: 'done' as MovieSortKey, align: 'text-center' },
                                ].map(({ label, key, align }) => (
                                    <th
                                        key={key}
                                        onClick={() => handleMovieSort(key)}
                                        className={`sortable ${align}`}
                                    >
                                        <div className="sort-header">
                                            {label} {renderSortIcon(key, movieSort.key, movieSort.dir)}
                                        </div>
                                    </th>
                                ))}
                                <th className="text-center">Actions</th>
                            </tr>
                            <tr className="filter-row">
                                {['title', 'total_cards', 'review_cards'].map(key => (
                                    <td key={key}>
                                        <input
                                            type="text"
                                            className="filter-input"
                                            placeholder="Filter..."
                                            value={movieFilters[key as keyof typeof movieFilters]}
                                            onChange={(e) => handleMovieFilterChange(key, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                ))}
                                <td>
                                    <Dropdown
                                        value={movieFilters.done}
                                        onChange={(value) => handleMovieFilterChange('done', String(value))}
                                        options={[
                                            { id: '', name: 'All' },
                                            { id: 'done', name: 'Done' },
                                            { id: 'pending', name: 'Pending' },
                                        ]}
                                        placeholder="Filter..."
                                    />
                                </td>
                                <td></td>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMovies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty">
                                        No movies found.
                                    </td>
                                </tr>
                            ) : (
                                filteredMovies.map(movie => (
                                    <tr key={movie.id}>
                                        <td
                                            className="clickable"
                                            onClick={() => navigate(`/admin/games/talkies/hero/${heroId}/movie/${movie.id}`, {
                                                state: { movieTitle: movie.title, movieLocked: movie.locked }
                                            })}
                                        >
                                            {movie.title}
                                        </td>
                                        <td className="text-center">{movie.total_cards || 0}</td>
                                        <td className="text-center">{movie.review_cards || 0}</td>
                                        <td className="text-center">
                                            {movie.done ? 'Done' : 'Pending'}
                                        </td>
                                        <td className="text-center">
                                            {movie.locked ? (
                                                <span className="locked-icon">{Icons.lock}</span>
                                            ) : (
                                                <div className="action-buttons">
                                                    {canUpdate('movies') && (
                                                        <button
                                                            className={`action-btn ${movie.need_review ? 'warning' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleMovieReview(movie);
                                                            }}
                                                            title={movie.need_review ? 'Mark Reviewed' : 'Mark for Review'}
                                                        >
                                                            {movie.need_review ? Icons.flagSolid : Icons.flagRegular}
                                                        </button>
                                                    )}
                                                    {canUpdate('movies') && (
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditMovieModal(movie);
                                                            }}
                                                        >
                                                            {Icons.edit}
                                                        </button>
                                                    )}
                                                    {canDelete('movies') && (
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteMovie(movie);
                                                            }}
                                                        >
                                                            {Icons.delete}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {[
                                    { label: 'Movie', key: 'movie_title' as CardSortKey, align: 'text-left' },
                                    { label: 'Name', key: 'name' as CardSortKey, align: 'text-center' },
                                    { label: 'Type', key: 'type' as CardSortKey, align: 'text-center' },
                                    { label: 'Call Sign', key: 'call_sign' as CardSortKey, align: 'text-center' },
                                    { label: 'Ability 1', key: 'ability1' as CardSortKey, align: 'text-left' },
                                    { label: 'Ability 2', key: 'ability2' as CardSortKey, align: 'text-left' },
                                ].map(({ label, key, align }) => (
                                    <th
                                        key={key}
                                        onClick={() => handleCardSort(key)}
                                        className={`sortable ${align}`}
                                    >
                                        <div className="sort-header">
                                            {label} {renderSortIcon(key, cardSort.key, cardSort.dir)}
                                        </div>
                                    </th>
                                ))}
                                <th className="text-center">Actions</th>
                            </tr>
                            <tr className="filter-row">
                                {['movie_title', 'name', 'type', 'call_sign', 'ability1', 'ability2'].map(key => (
                                    <td key={key}>
                                        <input
                                            type="text"
                                            className="filter-input"
                                            placeholder="Filter..."
                                            value={cardFilters[key as keyof typeof cardFilters]}
                                            onChange={(e) => handleCardFilterChange(key, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                ))}
                                <td></td>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCards.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="empty">
                                        No cards found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCards.map(card => (
                                    <tr key={card.id}>
                                        <td>{card.movie_title}</td>
                                        <td className="text-center">{card.name}</td>
                                        <td className="text-center">{card.type}</td>
                                        <td className="text-center">{card.call_sign}</td>
                                        <td className="ability-column">{card.ability_text || ''}</td>
                                        <td className="ability-column">{card.ability_text2 || ''}</td>
                                        <td className="text-center">
                                            {card.movie_locked ? (
                                                <span className="locked-icon">{Icons.lock}</span>
                                            ) : (
                                                <div className="action-buttons">
                                                    {canUpdate('cards') && (
                                                        <button
                                                            className={`action-btn ${card.need_review ? 'warning' : ''}`}
                                                            onClick={() => toggleCardReview(card)}
                                                            title={card.need_review ? 'Mark Reviewed' : 'Mark for Review'}
                                                        >
                                                            {card.need_review ? Icons.flagSolid : Icons.flagRegular}
                                                        </button>
                                                    )}
                                                    {canUpdate('cards') && (
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => openEditCardModal(card)}
                                                        >
                                                            {Icons.edit}
                                                        </button>
                                                    )}
                                                    {canDelete('cards') && (
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => handleDeleteCard(card)}
                                                        >
                                                            {Icons.delete}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tags Section */}
            <TagsSection heroId={parseInt(heroId!)} />

            {/* Movie Modal */}
            <Modal
                isOpen={isMovieModalOpen}
                onClose={() => setIsMovieModalOpen(false)}
                title={editingMovie ? 'Edit Movie' : 'Add Movie'}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveMovie();
                    }}
                    className="modal-form"
                >
                    <div className="form-group">
                        <label>
                            Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={movieForm.title}
                            onChange={(e) => setMovieForm({ title: e.target.value })}
                        />
                    </div>
                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => setIsMovieModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingMovie ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>

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
                            Movie *
                        </label>
                        <Dropdown
                            value={String(cardForm.movie_id)}
                            onChange={(value) => setCardForm({ ...cardForm, movie_id: parseInt(value) })}
                            options={movies.map(movie => ({
                                id: movie.id,
                                name: movie.title
                            }))}
                            placeholder="Select a movie..."
                            required
                        />
                    </div>
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
                            value={cardForm.ability1}
                            onChange={(e) => setCardForm({ ...cardForm, ability1: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            Ability 2
                        </label>
                        <textarea
                            value={cardForm.ability2}
                            onChange={(e) => setCardForm({ ...cardForm, ability2: e.target.value })}
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
                title={`Delete ${deleteConfirm.type === 'movie' ? 'Movie' : 'Card'}`}
                message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={deleteConfirm.type === 'movie' ? handleConfirmDeleteMovie : handleConfirmDeleteCard}
                onCancel={handleCancelDelete}
                isDangerous
            />
        </AdminLayout>
    );
}
