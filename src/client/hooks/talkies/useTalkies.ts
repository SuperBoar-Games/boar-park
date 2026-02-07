// Talkies game API client and React hooks for heroes, movies, cards, and tags

import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const GAME_SLUG = 'talkies';

// Types
export interface Hero {
    id: number;
    name: string;
    industry: string;
    total_movies?: number;
    pending_movies?: number;
    total_cards?: number;
}

export interface Movie {
    id: number;
    hero_id: number;
    title: string;
    locked: boolean;
    need_review: boolean;
    total_cards?: number;
    review_cards?: number;
    hero_name?: string;
}

export interface Card {
    id: number;
    movie_id: number;
    hero_id: number;
    movie_title?: string;
    name: string;
    type: string;
    call_sign?: string;
    ability_text?: string;
    ability_text2?: string;
    need_review: boolean;
    tags?: Tag[];
    tag_ids?: number[];
}

export interface Tag {
    id: number;
    name: string;
    color: string;
    card_count?: number; // Optional for hero-specific tags
}

// API Functions
export const talkiesApi = {
    // Heroes
    getHeroes: () => api.get<{ success: boolean; data: Hero[] }>('/api/talkies/heroes'),
    createHero: (data: Partial<Hero>) =>
        api.post<{ success: boolean; data: Hero }>('/api/talkies/heroes', { ...data, gameSlug: GAME_SLUG }),
    updateHero: (id: number, data: Partial<Hero>) =>
        api.put<{ success: boolean }>(`/api/talkies/heroes/${id}`, data),
    deleteHero: (id: number) =>
        api.delete<{ success: boolean }>(`/api/talkies/heroes/${id}`),

    // Movies
    getMoviesByHeroId: (heroId: number) =>
        api.get<{ success: boolean; data: Movie[] }>(`/api/talkies/movies?heroId=${heroId}`),
    createMovie: (data: { title: string; heroId: number }) =>
        api.post<{ success: boolean; data: Movie }>('/api/talkies/movies', data),
    updateMovieTitle: (id: number, title: string) =>
        api.put<{ success: boolean }>(`/api/talkies/movies/${id}`, { title }),
    updateMovieReview: (id: number, needReview: boolean) =>
        api.patch<{ success: boolean }>(`/api/talkies/movies/${id}/review`, { needReview, user: 'admin' }),
    updateMovieLocked: (id: number, locked: boolean) =>
        api.patch<{ success: boolean }>(`/api/talkies/movies/${id}/locked`, { locked, user: 'admin' }),
    deleteMovie: (id: number) =>
        api.delete<{ success: boolean }>(`/api/talkies/movies/${id}`),

    // Cards
    getCardsByHeroAndMovie: (heroId: number, movieId: number) =>
        api.get<{ success: boolean; data: Card[] }>(`/api/talkies/cards?heroId=${heroId}&movieId=${movieId}`),
    getAllCardsByHero: (heroId: number) =>
        api.get<{ success: boolean; data: Card[] }>(`/api/talkies/cards?heroId=${heroId}`),
    createCard: (data: Partial<Card>) =>
        api.post<{ success: boolean; data: Card }>('/api/talkies/cards', data),
    updateCard: (id: number, data: Partial<Card>) =>
        api.put<{ success: boolean }>(`/api/talkies/cards/${id}`, { ...data, user: 'admin' }),
    deleteCard: (id: number) =>
        api.delete<{ success: boolean }>(`/api/talkies/cards/${id}`),

    // Tags
    getTags: () =>
        api.get<{ success: boolean; data: Tag[] }>('/api/talkies/tags'),
    getTagCountsByHero: (heroId: number) =>
        api.get<{ success: boolean; data: any[] }>(`/api/talkies/tags?heroId=${heroId}`),
    createTag: (data: { name: string; color: string }) =>
        api.post<{ success: boolean; data: Tag }>('/api/talkies/tags', data),
    updateTag: (id: number, data: Partial<Tag>) =>
        api.put<{ success: boolean }>(`/api/talkies/tags/${id}`, data),
    deleteTag: (id: number) =>
        api.delete<{ success: boolean }>(`/api/talkies/tags/${id}`),
};

// React Hooks
export function useHeroes() {
    const [heroes, setHeroes] = useState<Hero[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHeroes = async () => {
        try {
            setLoading(true);
            const response = await talkiesApi.getHeroes();
            setHeroes(response.data || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch heroes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHeroes();
    }, []);

    return { heroes, loading, error, refetch: fetchHeroes };
}

export function useMovies(heroId: number | null) {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMovies = async () => {
        if (!heroId) return;
        try {
            setLoading(true);
            const response = await talkiesApi.getMoviesByHeroId(heroId);
            setMovies(response.data || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch movies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, [heroId]);

    return { movies, loading, error, refetch: fetchMovies };
}

export function useCards(heroId: number | null, movieId?: number) {
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCards = async () => {
        if (!heroId) return;
        try {
            setLoading(true);
            const response = movieId
                ? await talkiesApi.getCardsByHeroAndMovie(heroId, movieId)
                : await talkiesApi.getAllCardsByHero(heroId);
            setCards(response.data || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch cards');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCards();
    }, [heroId, movieId]);

    return { cards, loading, error, refetch: fetchCards };
}

export function useTags(heroId?: number) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTags = async () => {
        try {
            setLoading(true);
            const response = heroId
                ? await talkiesApi.getTagCountsByHero(heroId)
                : await talkiesApi.getTags();

            // Normalize the response - backend returns tag_id, tag_name for hero-specific
            const normalizedTags = (response.data || []).map((tag: any) => ({
                id: tag.id || tag.tag_id,
                name: tag.name || tag.tag_name,
                color: tag.color || '',
                card_count: tag.card_count
            }));

            setTags(normalizedTags);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tags');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, [heroId]);

    return { tags, loading, error, refetch: fetchTags };
}
