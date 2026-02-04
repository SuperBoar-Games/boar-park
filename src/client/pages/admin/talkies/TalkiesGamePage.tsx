import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../components/AdminLayout';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { Icons } from '../../../components/Icons';
import { useHeroes, Hero, talkiesApi } from '../../../hooks/useTalkies';

type SortKey = 'name' | 'industry' | 'total_movies' | 'pending_movies' | 'total_cards';

export default function TalkiesGamePage() {
    const navigate = useNavigate();
    const { heroes: heroesFromHook, loading, error, refetch } = useHeroes();
    const [heroes, setHeroes] = useState<Hero[]>([]);

    // Sync from hook to local state
    React.useEffect(() => {
        setHeroes(heroesFromHook);
    }, [heroesFromHook]);

    const [sortState, setSortState] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
        key: 'name',
        dir: 'asc',
    });

    const [filters, setFilters] = useState({
        name: '',
        total_movies: '',
        pending_movies: '',
        total_cards: '',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHero, setEditingHero] = useState<Hero | null>(null);
    const [formData, setFormData] = useState({ name: '', industry: '' });

    // Get unique industries
    const industries = useMemo(() => {
        return [...new Set(heroes.map(h => h.industry))].filter(Boolean);
    }, [heroes]);

    // Filter and sort
    const filteredHeroes = useMemo(() => {
        let filtered = heroes.filter(hero => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                const heroValue = String(hero[key as keyof Hero] || '').toLowerCase();
                return heroValue.includes(value.toLowerCase());
            });
        });

        filtered.sort((a, b) => {
            const { key, dir } = sortState;
            let valA = a[key] || 0;
            let valB = b[key] || 0;

            if (typeof valA === 'number' && typeof valB === 'number') {
                return dir === 'asc' ? valA - valB : valB - valA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            return dir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });

        return filtered;
    }, [heroes, filters, sortState]);

    const handleSort = (key: SortKey) => {
        setSortState(prev => ({
            key,
            dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            name: '',
            total_movies: '',
            pending_movies: '',
            total_cards: '',
        });
    };

    const openAddModal = () => {
        setEditingHero(null);
        setFormData({ name: '', industry: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (hero: Hero) => {
        setEditingHero(hero);
        setFormData({ name: hero.name, industry: hero.industry });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const previousHeroes = heroes;
        try {
            if (editingHero) {
                await talkiesApi.updateHero(editingHero.id, formData);
                setHeroes(prev => prev.map(h => h.id === editingHero.id ? { ...h, ...formData } : h));
            } else {
                const response = await talkiesApi.createHero(formData);
                if (response.data && response.data.data) {
                    setHeroes(prev => [...prev, response.data.data]);
                }
            }
            setIsModalOpen(false);
        } catch (err) {
            setHeroes(previousHeroes);
            alert('Failed to save hero');
        }
    };

    const handleDelete = async (hero: Hero) => {
        if (!confirm(`Delete "${hero.name}"?`)) return;
        const previousHeroes = heroes;
        try {
            setHeroes(prev => prev.filter(h => h.id !== hero.id));
            await talkiesApi.deleteHero(hero.id);
        } catch (err) {
            setHeroes(previousHeroes);
            alert('Failed to delete hero');
        }
    };

    const renderSortIcon = (key: SortKey) => {
        if (sortState.key !== key) return Icons.sort;
        return sortState.dir === 'asc' ? Icons.sortUp : Icons.sortDown;
    };

    if (loading) return <AdminLayout title={<h1>Talkies</h1>}><p>Loading...</p></AdminLayout>;
    if (error) return <AdminLayout title={<h1>Talkies</h1>}><p className="error-message">{error}</p></AdminLayout>;

    return (
        <AdminLayout
            title={<h1>Talkies</h1>}
            actions={
                <Button variant="secondary" onClick={() => navigate('/admin')}>
                    {Icons.arrowLeft} <span>Back to Admin</span>
                </Button>
            }
        >
            <div className="table-controls">
                <Button variant="secondary" onClick={clearFilters}>
                    {Icons.filter} <span>Clear Filters</span>
                </Button>
                <Button onClick={openAddModal}>
                    {Icons.plus} <span>Add Hero</span>
                </Button>
            </div>

            <div className="table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            {[
                                { label: 'Hero Name', key: 'name' as SortKey, align: 'text-left' },
                                { label: 'Total Movies', key: 'total_movies' as SortKey, align: 'text-center' },
                                { label: 'Pending', key: 'pending_movies' as SortKey, align: 'text-center' },
                                { label: 'Cards', key: 'total_cards' as SortKey, align: 'text-center' },
                            ].map(({ label, key, align }) => (
                                <th
                                    key={key}
                                    onClick={() => handleSort(key)}
                                    className={`sortable ${align}`}
                                >
                                    <div className="sort-header">
                                        {label} {renderSortIcon(key)}
                                    </div>
                                </th>
                            ))}
                            <th className="text-center">Actions</th>
                        </tr>
                        <tr className="filter-row">
                            {['name', 'total_movies', 'pending_movies', 'total_cards'].map(key => (
                                <td key={key}>
                                    <input
                                        type="text"
                                        className="filter-input"
                                        placeholder="Filter..."
                                        value={filters[key as keyof typeof filters]}
                                        onChange={(e) => handleFilterChange(key, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </td>
                            ))}
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHeroes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="empty">
                                    No heroes found.
                                </td>
                            </tr>
                        ) : (
                            filteredHeroes.map(hero => (
                                <tr key={hero.id}>
                                    <td
                                        className="clickable"
                                        onClick={() => navigate(`/admin/games/talkies/hero/${hero.id}`, { state: { heroName: hero.name } })}
                                    >
                                        {hero.name}
                                    </td>
                                    <td className="text-center">{hero.total_movies || 0}</td>
                                    <td className="text-center">{hero.pending_movies || 0}</td>
                                    <td className="text-center">{hero.total_cards || 0}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditModal(hero);
                                                }}
                                            >
                                                {Icons.edit}
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(hero);
                                                }}
                                            >
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
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingHero ? 'Edit Hero' : 'Add Hero'}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSave();
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
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            Industry
                        </label>
                        <input
                            type="text"
                            list="industries"
                            value={formData.industry}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        />
                        <datalist id="industries">
                            {industries.map(ind => (
                                <option key={ind} value={ind} />
                            ))}
                        </datalist>
                    </div>
                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingHero ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
