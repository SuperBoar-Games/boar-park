// React Query mutations for Talkies game CRUD operations with automatic cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import type { Hero, Movie, Card, Tag } from './types';

// ========== HEROES ==========

export function useCreateHeroMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Hero>) => {
      const response = await apiClient.post<{ success: boolean; data: Hero }>(
        '/api/talkies/heroes',
        { ...data, gameSlug: 'talkies' }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.heroes() });
    },
  });
}

export function useUpdateHeroMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Hero> }) => {
      return apiClient.put(`/api/talkies/heroes/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.hero(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.heroes() });
    },
  });
}

export function useDeleteHeroMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return apiClient.delete(`/api/talkies/heroes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.heroes() });
    },
    onError: () => {
      alert('Failed to delete hero');
    },
  });
}

// ========== MOVIES ==========

export function useCreateMovieMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; heroId: number }) => {
      const response = await apiClient.post<{ success: boolean; data: Movie }>(
        '/api/talkies/movies',
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate movies for this hero
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.movies(variables.heroId) });
      // CRITICAL: Invalidate hero to update movie counts!
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.heroes() });
    },
  });
}

export function useUpdateMovieMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { title?: string; locked?: boolean; needReview?: boolean };
    }) => {
      if (data.title !== undefined) {
        return apiClient.put(`/api/talkies/movies/${id}`, { title: data.title });
      } else if (data.locked !== undefined) {
        return apiClient.patch(`/api/talkies/movies/${id}/locked`, {
          locked: data.locked,
          user: 'admin',
        });
      } else if (data.needReview !== undefined) {
        return apiClient.patch(`/api/talkies/movies/${id}/review`, {
          needReview: data.needReview,
          user: 'admin',
        });
      }
    },
    onSuccess: () => {
      // Invalidate all talkies data (we don't have specific context)
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.all });
    },
    onError: () => {
      alert('Failed to update movie');
    },
  });
}

export function useDeleteMovieMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, heroId }: { id: number; heroId: number }) => {
      return apiClient.delete(`/api/talkies/movies/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.movies(variables.heroId) });
      // Update hero counts
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.heroes() });
    },
    onError: () => {
      alert('Failed to delete movie');
    },
  });
}

// ========== CARDS ==========

export function useCreateCardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Card>) => {
      const response = await apiClient.post<{ success: boolean; data: Card }>(
        '/api/talkies/cards',
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate cards for this hero
      if (variables.hero_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.talkies.cards(variables.hero_id) });
      }
      // Update hero and movie counts
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.heroes() });
      if (variables.hero_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.talkies.movies(variables.hero_id) });
      }
    },
  });
}

export function useUpdateCardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Card> }) => {
      const payloadToSend = { ...data, user: 'admin' };
      return apiClient.put(`/api/talkies/cards/${id}`, payloadToSend);
    },
    onSuccess: () => {
      // Invalidate all talkies queries with partial matching (not exact match)
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.all, exact: false });
    },
  });
}

export function useDeleteCardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, heroId }: { id: number; heroId: number }) => {
      return apiClient.delete(`/api/talkies/cards/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.cards(variables.heroId) });
      // Update counts
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.heroes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.movies(variables.heroId) });
    },
    onError: () => {
      alert('Failed to delete card');
    },
  });
}

// ========== TAGS ==========

export function useCreateTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const response = await apiClient.post<{ success: boolean; data: Tag }>(
        '/api/talkies/tags',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.tags.all() });
    },
  });
}

export function useUpdateTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Tag> }) => {
      return apiClient.put(`/api/talkies/tags/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.tags.all() });
    },
  });
}

export function useDeleteTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return apiClient.delete(`/api/talkies/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.tags.all() });
    },
  });
}
