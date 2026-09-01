// Admin page for managing Talkies game heroes with sorting and filtering

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermissionCheck } from '../../../hooks/auth/usePermissions';
import { AdminLayout } from '../../../components/AdminLayout';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Icons } from '../../../components/Icons';
import { IndustryCombobox } from '../../../components/IndustryCombobox';
import { DataTable, type Column } from '../../../components/DataTable';
import { useHeroesQuery } from '../../../hooks/talkies/useTalkiesQueries';
import {
  useCreateHeroMutation,
  useUpdateHeroMutation,
  useDeleteHeroMutation,
} from '../../../hooks/talkies/useTalkiesMutations';
import type { Hero } from '../../../hooks/talkies/types';

type SortKey = 'name' | 'total_movies' | 'pending_movies' | 'total_cards';

// Industry is still captured on the hero record and edited in the modal, but
// every hero currently shares one industry, so a column of identical chips
// earned nothing. Bring it back as a column when the catalogue spans more.
const COLUMNS: Column<Hero>[] = [
  { key: 'name', label: 'Hero', align: 'left', filter: 'text' },
  {
    key: 'total_movies', label: 'Movies', align: 'center', filter: 'text', width: '9rem',
    render: hero => <Figure value={hero.total_movies} />,
  },
  {
    key: 'pending_movies', label: 'Pending', align: 'center', filter: 'text', width: '9rem',
    render: hero => hero.pending_movies
      ? <span className="count-pill count-pill-attention">{hero.pending_movies}</span>
      : <span className="num-zero">0</span>,
  },
  {
    key: 'total_cards', label: 'Cards', align: 'center', filter: 'text', width: '9rem',
    render: hero => <Figure value={hero.total_cards} />,
  },
];

const EMPTY_FILTERS = {
  name: '',
  total_movies: '',
  pending_movies: '',
  total_cards: '',
};

// A zero carries no news — render it faint so the eye lands on real counts.
function Figure({ value }: { value?: number }) {
  const n = value || 0;
  return <span className={n === 0 ? 'num-zero' : undefined}>{n.toLocaleString()}</span>;
}

export default function TalkiesGamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreate, canUpdate, canDelete } = usePermissionCheck();
  const { data: heroes = [], isLoading, error } = useHeroesQuery();
  const createHero = useCreateHeroMutation();
  const updateHero = useUpdateHeroMutation();
  const deleteHero = useDeleteHeroMutation();

  // UI state only - not mirroring server data
  const [sortState, setSortState] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'name',
    dir: 'asc',
  });

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHero, setEditingHero] = useState<Hero | null>(null);
  const [formData, setFormData] = useState({ name: '', industry: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; heroId: number; heroName: string }>({ isOpen: false, heroId: 0, heroName: '' });

  // Derived data with useMemo (NOT useState)
  const filteredHeroes = useMemo(() => {
    let filtered = heroes.filter(hero => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const heroValue = String(hero[key as keyof Hero] ?? '').toLowerCase();
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

  // Extract unique industries from existing heroes
  const uniqueIndustries = useMemo(() => {
    const industries = new Set(heroes.map(h => h.industry).filter(Boolean));
    return Array.from(industries).sort();
  }, [heroes]);

  // Headline figures for the summary strip
  const totals = useMemo(() => heroes.reduce(
    (acc, h) => ({
      movies: acc.movies + (h.total_movies || 0),
      pending: acc.pending + (h.pending_movies || 0),
      cards: acc.cards + (h.total_cards || 0),
    }),
    { movies: 0, pending: 0, cards: 0 },
  ), [heroes]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  // The name filter lives in the toolbar search, so only the rest are "columns"
  const columnFilterCount = activeFilterCount - (filters.name ? 1 : 0);

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
    setFilters(EMPTY_FILTERS);
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
    try {
      const currentUser = user?.username || 'admin';
      if (editingHero) {
        await updateHero.mutateAsync({ id: editingHero.id, data: { ...formData, user: currentUser } });
      } else {
        await createHero.mutateAsync({ ...formData, gameSlug: 'talkies', user: currentUser });
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to save hero');
    }
  };

  const handleDelete = (hero: Hero) => {
    setDeleteConfirm({ isOpen: true, heroId: hero.id, heroName: hero.name });
  };

  const handleConfirmDelete = () => {
    deleteHero.mutate(deleteConfirm.heroId);
    setDeleteConfirm({ isOpen: false, heroId: 0, heroName: '' });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, heroId: 0, heroName: '' });
  };

  if (isLoading) {
    return (
      <AdminLayout title={<h1>Talkies</h1>} breadcrumbs={[{ label: 'Admin', to: '/admin' }]}>
        <div className="page-status">Loading heroes…</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title={<h1>Talkies</h1>} breadcrumbs={[{ label: 'Admin', to: '/admin' }]}>
        <div className="page-status page-status-error">
          Couldn’t load heroes. {String(error)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={<h1>Talkies</h1>}
      breadcrumbs={[{ label: 'Admin', to: '/admin' }]}
    >
      {/* Summary — the three figures an admin opens this page to check */}
      <div className="stat-strip">
        <div className="stat-tile">
          <span className="stat-label">Heroes</span>
          <span className="stat-value">{heroes.length.toLocaleString()}</span>
          <span className="stat-note">
            {uniqueIndustries.length} {uniqueIndustries.length === 1 ? 'industry' : 'industries'}
          </span>
        </div>
        <div className={`stat-tile${totals.pending > 0 ? ' stat-tile-attention' : ''}`}>
          <span className="stat-label">Pending movies</span>
          <span className="stat-value">{totals.pending.toLocaleString()}</span>
          <span className="stat-note">
            {totals.pending > 0 ? 'waiting on review' : 'all caught up'}
          </span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Cards</span>
          <span className="stat-value">{totals.cards.toLocaleString()}</span>
          <span className="stat-note">across {totals.movies.toLocaleString()} movies</span>
        </div>
      </div>

      <div className="table-controls">
        <div className="table-controls-left">
          <div className="search-field">
            <i className="fa-solid fa-magnifying-glass search-field-icon" aria-hidden="true" />
            <input
              type="search"
              className="search-field-input"
              placeholder="Search heroes"
              aria-label="Search heroes by name"
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
            />
          </div>

          <Button
            variant="secondary"
            aria-pressed={showFilters}
            className={showFilters ? 'is-active' : ''}
            onClick={() => setShowFilters(v => !v)}
          >
            {Icons.filter}
            <span>Filters</span>
            {columnFilterCount > 0 && <span className="btn-count">{columnFilterCount}</span>}
          </Button>

          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={clearFilters}>
              <span>Clear</span>
            </Button>
          )}
        </div>

        {canCreate('heroes') && (
          <Button onClick={openAddModal}>
            {Icons.plus} <span>Add hero</span>
          </Button>
        )}
      </div>

      <DataTable
        columns={COLUMNS}
        rows={filteredHeroes}
        rowKey={hero => hero.id}
        sort={sortState}
        onSort={key => handleSort(key as SortKey)}
        showFilters={showFilters}
        filters={filters}
        onFilterChange={handleFilterChange}
        onRowClick={hero =>
          navigate(`/admin/games/talkies/hero/${hero.id}`, { state: { heroName: hero.name } })
        }
        empty={
          heroes.length === 0 ? (
            <div className="empty-block">
              <p className="empty-title">No heroes yet</p>
              <p className="empty-hint">Add the first hero to start building the deck.</p>
              {canCreate('heroes') && (
                <Button onClick={openAddModal}>
                  {Icons.plus} <span>Add hero</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="empty-block">
              <p className="empty-title">No heroes match these filters</p>
              <Button variant="secondary" onClick={clearFilters}>
                <span>Clear filters</span>
              </Button>
            </div>
          )
        }
        actions={hero => (
          <div className="action-buttons">
            {canUpdate('heroes') && (
              <button
                className="action-btn edit"
                aria-label={`Edit ${hero.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(hero);
                }}
              >
                {Icons.edit}
              </button>
            )}
            {canDelete('heroes') && (
              <button
                className="action-btn delete"
                aria-label={`Delete ${hero.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(hero);
                }}
              >
                {Icons.delete}
              </button>
            )}
          </div>
        )}
      />

      {/* Only worth showing when the table is a subset — an unfiltered count
          just repeats the Heroes tile above. */}
      {filteredHeroes.length > 0 && filteredHeroes.length !== heroes.length && (
        <p className="table-footnote">
          {filteredHeroes.length.toLocaleString()} of {heroes.length.toLocaleString()} heroes
        </p>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHero ? 'Edit hero' : 'Add hero'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="modal-form"
        >
          <div className="form-group">
            <label htmlFor="hero-name">Name</label>
            <input
              id="hero-name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Kamal Haasan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="hero-industry">Industry</label>
            <IndustryCombobox
              value={formData.industry}
              onChange={(value) => setFormData({ ...formData, industry: value })}
              industries={uniqueIndustries}
              required
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingHero ? 'Save changes' : 'Add hero'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete hero"
        message={`Delete "${deleteConfirm.heroName}"? Its movies and cards go with it. This can't be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDangerous
      />
    </AdminLayout>
  );
}
