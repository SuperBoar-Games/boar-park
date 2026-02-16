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
import { useHeroesQuery } from '../../../hooks/talkies/useTalkiesQueries';
import {
  useCreateHeroMutation,
  useUpdateHeroMutation,
  useDeleteHeroMutation,
} from '../../../hooks/talkies/useTalkiesMutations';
import type { Hero } from '../../../hooks/talkies/types';

type SortKey = 'name' | 'industry' | 'total_movies' | 'pending_movies' | 'total_cards';

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

  const [filters, setFilters] = useState({
    name: '',
    total_movies: '',
    pending_movies: '',
    total_cards: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHero, setEditingHero] = useState<Hero | null>(null);
  const [formData, setFormData] = useState({ name: '', industry: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; heroId: number; heroName: string }>({ isOpen: false, heroId: 0, heroName: '' });

  // Derived data with useMemo (NOT useState)
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

  // Extract unique industries from existing heroes
  const uniqueIndustries = useMemo(() => {
    const industries = new Set(heroes.map(h => h.industry).filter(Boolean));
    return Array.from(industries).sort();
  }, [heroes]);

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

  const renderSortIcon = (key: SortKey) => {
    if (sortState.key !== key) return Icons.sort;
    return sortState.dir === 'asc' ? Icons.sortUp : Icons.sortDown;
  };

  if (isLoading) return <AdminLayout title={<h1>Talkies</h1>}><p>Loading...</p></AdminLayout>;
  if (error) return <AdminLayout title={<h1>Talkies</h1>}><p className="error-message">{String(error)}</p></AdminLayout>;

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
        {canCreate('heroes') && (
          <Button onClick={openAddModal}>
            {Icons.plus} <span>Add Hero</span>
          </Button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="data-table">
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
                      {canUpdate('heroes') && (
                        <button
                          className="action-btn edit"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(hero);
                          }}
                        >
                          {Icons.delete}
                        </button>
                      )}
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
              Industry *
            </label>
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
              {editingHero ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Hero"
        message={`Are you sure you want to delete "${deleteConfirm.heroName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDangerous
      />
    </AdminLayout>
  );
}
