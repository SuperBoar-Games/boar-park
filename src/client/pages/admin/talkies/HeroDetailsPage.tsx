// Hero details page for managing movies and cards for a specific hero

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { DataTable, type Column } from '../../../components/DataTable';
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
import { downloadWithAuth } from '../../../utils/downloadFile';
import { Toast } from '../../../components/Toast';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';
const FILE_TYPE_LABELS: Record<number, string> = { 1: 'Design', 2: 'Image', 3: 'Print' };

// One export control, not two. "Download" (card files as ZIP) and "Export CSV"
// were separate top-level buttons doing the same job from the user's side:
// getting data out. They're one menu now.
function HeroExportMenu({ heroId, onExportCsv }: { heroId: number; onExportCsv: () => void }) {
    const [open, setOpen] = useState(false);
    const [types, setTypes] = useState<Set<number>>(new Set([1, 2, 3]));
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
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
            `${API_BASE_URL}/api/heroes/${heroId}/download?types=${typesParam}`,
            accessToken,
            `hero-${heroId}-files.zip`,
        );
        setBusy(false);
        if (result.ok) setOpen(false);
        else setToast(result.error || 'Download failed');
    };

    return (
        <div className="download-dropdown-wrapper" ref={ref}>
            {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
            <button
                className="btn btn-secondary"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                title="Export this hero's data"
            >
                <i className="fa-solid fa-download" /> <span>Export</span>
            </button>
            {open && (
                <div className="download-dropdown">
                    <div className="download-dropdown-title">Card files</div>
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

                    <div className="download-dropdown-divider" />

                    <button
                        className="download-secondary-btn"
                        onClick={() => { onExportCsv(); setOpen(false); }}
                    >
                        <i className="fa-solid fa-file-csv" /> Export card list (CSV)
                    </button>
                </div>
            )}
        </div>
    );
}

const HERO_CRUMBS = [
    { label: 'Admin', to: '/admin' },
    { label: 'Talkies', to: '/admin/games/talkies' },
];

type MovieSortKey = 'title' | 'total_cards' | 'review_cards' | 'done';
type CardSortKey = 'movie_title' | 'name' | 'type' | 'call_sign';

const MOVIE_COLUMNS: Column<Movie>[] = [
    { key: 'title', label: 'Title', align: 'left', filter: 'text' },
    {
        key: 'total_cards', label: 'Cards', align: 'center', filter: 'text', width: '8rem',
        render: movie => (
            <span className={movie.total_cards ? undefined : 'num-zero'}>
                {movie.total_cards || 0}
            </span>
        ),
    },
    {
        key: 'review_cards', label: 'To review', align: 'center', filter: 'text', width: '10rem',
        render: movie => movie.review_cards
            ? <span className="count-pill count-pill-attention">{movie.review_cards}</span>
            : <span className="num-zero">0</span>,
    },
    {
        key: 'done', label: 'Status', align: 'left', width: '10rem',
        filter: {
            options: [
                { id: '', name: 'All' },
                { id: 'done', name: 'Done' },
                { id: 'pending', name: 'Pending' },
            ],
        },
        render: movie => (
            <span className={`status-badge ${movie.done ? 'active' : 'pending'}`}>
                {movie.done ? 'Done' : 'Pending'}
            </span>
        ),
    },
];

const CARD_COLUMNS: Column<Card>[] = [
    { key: 'movie_title', label: 'Movie', align: 'left', filter: 'text', width: '14rem' },
    { key: 'name', label: 'Name', align: 'left', filter: 'text', width: '12rem' },
    {
        key: 'type', label: 'Type', align: 'left', filter: 'text', width: '8rem',
        render: card => card.type ? <span className="chip">{card.type}</span> : null,
    },
    { key: 'call_sign', label: 'Call sign', align: 'left', filter: 'text', width: '12rem' },
    {
        key: 'ability1', label: 'Ability 1', align: 'left', filter: 'text',
        className: 'ability-column',
        render: card => card.ability_text || '',
    },
    {
        key: 'ability2', label: 'Ability 2', align: 'left', filter: 'text',
        className: 'ability-column',
        render: card => card.ability_text2 || '',
    },
];

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

    const [showFilters, setShowFilters] = useState(false);
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

    // Only the filters for the visible table count toward the badge
    const activeFilterCount = Object.values(
        viewMode === 'movies' ? movieFilters : cardFilters,
    ).filter(Boolean).length;

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

    if (moviesLoading || cardsLoading) {
        return (
            <AdminLayout title={<h1>{heroName}</h1>} breadcrumbs={HERO_CRUMBS}>
                <div className="page-status">Loading {heroName}…</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title={<h1>{heroName}</h1>}
            breadcrumbs={HERO_CRUMBS}
        >
            <div className="table-controls">
                <div className="table-controls-left">
                    <div className="segmented" role="group" aria-label="View">
                        <button
                            className={`segmented-option ${viewMode === 'movies' ? 'active' : ''}`}
                            aria-pressed={viewMode === 'movies'}
                            onClick={() => changeViewMode('movies')}
                        >
                            Movies
                        </button>
                        <button
                            className={`segmented-option ${viewMode === 'cards' ? 'active' : ''}`}
                            aria-pressed={viewMode === 'cards'}
                            onClick={() => changeViewMode('cards')}
                        >
                            Cards
                        </button>
                    </div>
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
                    {viewMode === 'movies' ? (
                        canCreate('movies') && (
                            <Button onClick={openAddMovieModal}>
                                {Icons.plus} <span>Add movie</span>
                            </Button>
                        )
                    ) : (
                        canCreate('cards') && (
                            <Button onClick={openAddCardModal}>
                                {Icons.plus} <span>Add card</span>
                            </Button>
                        )
                    )}
                </div>
                <div className="table-controls-right">
                    <HeroExportMenu heroId={parseInt(heroId!)} onExportCsv={handleExportCSV} />
                </div>
            </div>

            {viewMode === 'movies' ? (
                <DataTable
                    columns={MOVIE_COLUMNS}
                    rows={filteredMovies}
                    rowKey={movie => movie.id}
                    sort={movieSort}
                    onSort={key => handleMovieSort(key as MovieSortKey)}
                    showFilters={showFilters}
                    filters={movieFilters}
                    onFilterChange={handleMovieFilterChange}
                    onRowClick={movie => navigate(
                        `/admin/games/talkies/hero/${heroId}/movie/${movie.id}`,
                        { state: { movieTitle: movie.title, movieLocked: movie.locked, heroName } },
                    )}
                    empty={
                        <div className="empty-block">
                            <p className="empty-title">No movies here yet</p>
                            <p className="empty-hint">Add a movie to start attaching cards to it.</p>
                        </div>
                    }
                    actions={movie => movie.locked ? (
                        <span className="locked-icon" title="Locked">{Icons.lock}</span>
                    ) : (
                        <div className="action-buttons">
                            {canUpdate('movies') && (
                                <button
                                    className={`action-btn ${movie.need_review ? 'warning' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMovieReview(movie);
                                    }}
                                    title={movie.need_review ? 'Mark reviewed' : 'Mark for review'}
                                >
                                    {movie.need_review ? Icons.flagSolid : Icons.flagRegular}
                                </button>
                            )}
                            {canUpdate('movies') && (
                                <button
                                    className="action-btn edit"
                                    aria-label={`Edit ${movie.title}`}
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
                                    aria-label={`Delete ${movie.title}`}
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
                />
            ) : (
                <DataTable
                    columns={CARD_COLUMNS}
                    rows={filteredCards}
                    rowKey={card => card.id}
                    sort={cardSort}
                    onSort={key => handleCardSort(key as CardSortKey)}
                    showFilters={showFilters}
                    filters={cardFilters}
                    onFilterChange={handleCardFilterChange}
                    empty={
                        <div className="empty-block">
                            <p className="empty-title">No cards here yet</p>
                            <p className="empty-hint">Cards you add to this hero’s movies show up here.</p>
                        </div>
                    }
                    actions={card => card.movie_locked ? (
                        <span className="locked-icon" title="Locked">{Icons.lock}</span>
                    ) : (
                        <div className="action-buttons">
                            {canUpdate('cards') && (
                                <button
                                    className={`action-btn ${card.need_review ? 'warning' : ''}`}
                                    onClick={() => toggleCardReview(card)}
                                    title={card.need_review ? 'Mark reviewed' : 'Mark for review'}
                                >
                                    {card.need_review ? Icons.flagSolid : Icons.flagRegular}
                                </button>
                            )}
                            {canUpdate('cards') && (
                                <button
                                    className="action-btn edit"
                                    aria-label={`Edit ${card.name}`}
                                    onClick={() => openEditCardModal(card)}
                                >
                                    {Icons.edit}
                                </button>
                            )}
                            {canDelete('cards') && (
                                <button
                                    className="action-btn delete"
                                    aria-label={`Delete ${card.name}`}
                                    onClick={() => handleDeleteCard(card)}
                                >
                                    {Icons.delete}
                                </button>
                            )}
                        </div>
                    )}
                />
            )}

            {/* Tags Section */}
            <TagsSection heroId={parseInt(heroId!)} />

            {/* Movie Modal */}
            <Modal
                isOpen={isMovieModalOpen}
                onClose={() => setIsMovieModalOpen(false)}
                title={editingMovie ? 'Edit movie' : 'Add movie'}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveMovie();
                    }}
                    className="modal-form"
                >
                    <div className="form-group">
                        <label htmlFor="movie-title">Title</label>
                        <input
                            id="movie-title"
                            type="text"
                            required
                            autoFocus
                            placeholder="e.g. Baahubali"
                            value={movieForm.title}
                            onChange={(e) => setMovieForm({ title: e.target.value })}
                        />
                    </div>
                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => setIsMovieModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingMovie ? 'Save changes' : 'Add movie'}
                        </Button>
                    </div>
                </form>
            </Modal>

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
                    <div className="form-group">
                        <label>Movie</label>
                        <Dropdown
                            value={String(cardForm.movie_id)}
                            onChange={(value) => setCardForm({ ...cardForm, movie_id: parseInt(value) })}
                            options={movies.map(movie => ({
                                id: movie.id,
                                name: movie.title
                            }))}
                            placeholder="Select a movie"
                            required
                        />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="hero-card-name">Name</label>
                            <input
                                id="hero-card-name"
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
                        <label htmlFor="hero-card-callsign">
                            Call sign <span className="form-optional">Optional</span>
                        </label>
                        <input
                            id="hero-card-callsign"
                            type="text"
                            placeholder="The line this character is known for"
                            value={cardForm.call_sign}
                            onChange={(e) => setCardForm({ ...cardForm, call_sign: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="hero-card-ability-1">
                            Ability 1 <span className="form-optional">Optional</span>
                        </label>
                        <textarea
                            id="hero-card-ability-1"
                            placeholder="What this card does when played"
                            value={cardForm.ability1}
                            onChange={(e) => setCardForm({ ...cardForm, ability1: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="hero-card-ability-2">
                            Ability 2 <span className="form-optional">Optional</span>
                        </label>
                        <textarea
                            id="hero-card-ability-2"
                            placeholder="A second ability, if the card has one"
                            value={cardForm.ability2}
                            onChange={(e) => setCardForm({ ...cardForm, ability2: e.target.value })}
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
                title={`Delete ${deleteConfirm.type === 'movie' ? 'Movie' : 'Card'}`}
                message={`Delete "${deleteConfirm.name}"? This can’	 be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={deleteConfirm.type === 'movie' ? handleConfirmDeleteMovie : handleConfirmDeleteCard}
                onCancel={handleCancelDelete}
                isDangerous
            />
        </AdminLayout>
    );
}
