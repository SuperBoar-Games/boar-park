// React Query hooks for Talkies game data fetching

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import type { Hero, Movie, Card, Tag } from './types';

/*
 * The stats views (hero_stats, movie_stats) count with bigint, and the driver
 * serialises bigint as a STRING. Left alone that means `a + b` concatenates
 * ("0"+"1"+"1"+"4" -> "0114") and `count ? ... : ...` treats "0" as truthy.
 * Normalise once here so the declared `number` types are actually true and
 * every consumer — sums, comparisons, sorting — behaves.
 */
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeHero = (h: Hero): Hero => ({
  ...h,
  total_movies: num(h.total_movies),
  pending_movies: num(h.pending_movies),
  total_cards: num(h.total_cards),
});

// movie_stats exposes `total_cards_need_review`; the client has always read
// `review_cards`, which never existed in the payload, so the "To review"
// column silently rendered 0. Map it here.
const normalizeMovie = (m: Movie & { total_cards_need_review?: unknown }): Movie => ({
  ...m,
  total_cards: num(m.total_cards),
  review_cards: num(m.review_cards ?? m.total_cards_need_review),
});

// ========== HEROES ==========

export function useHeroesQuery() {
  return useQuery({
    queryKey: queryKeys.talkies.heroes(),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Hero[] }>(
        '/api/talkies/heroes'
      );
      return (response.data ?? []).map(normalizeHero);
    },
  });
}

export function useHeroQuery(heroId: number | null) {
  return useQuery({
    queryKey: heroId ? queryKeys.talkies.hero(heroId) : [],
    queryFn: async () => {
      const response = await useHeroesQuery();
      return response.data?.find(h => h.id === heroId);
    },
    enabled: heroId !== null,
  });
}

// ========== MOVIES ==========

export function useMoviesQuery(heroId: number | null) {
  return useQuery({
    queryKey: heroId ? queryKeys.talkies.movies(heroId) : [],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Movie[] }>(
        `/api/talkies/movies?heroId=${heroId}`
      );
      return (response.data ?? []).map(normalizeMovie);
    },
    enabled: heroId !== null,
  });
}

// ========== CARDS ==========

export function useCardsQuery(heroId: number | null, movieId?: number) {
  return useQuery({
    queryKey: heroId ? queryKeys.talkies.cards(heroId, movieId) : [],
    queryFn: async () => {
      const endpoint = movieId
        ? `/api/talkies/cards?heroId=${heroId}&movieId=${movieId}`
        : `/api/talkies/cards?heroId=${heroId}`;
      const response = await apiClient.get<{ success: boolean; data: Card[] }>(endpoint);
      return response.data;
    },
    enabled: heroId !== null,
  });
}

// ========== TAGS ==========

export function useTagsQuery(heroId?: number) {
  return useQuery({
    queryKey: heroId ? queryKeys.talkies.tags.hero(heroId) : queryKeys.talkies.tags.all(),
    queryFn: async () => {
      const endpoint = heroId
        ? `/api/talkies/tags?heroId=${heroId}`
        : '/api/talkies/tags';
      const response = await apiClient.get<{ success: boolean; data: any[] }>(endpoint);

      // Normalize response (backend inconsistency)
      return response.data.map((tag: any) => ({
        id: tag.id || tag.tag_id,
        name: tag.name || tag.tag_name,
        color: tag.color || '',
        card_count: tag.card_count,
      }));
    },
  });
}
