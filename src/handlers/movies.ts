import { sql } from "bun";
import { jsonResponse } from "../utils";
import {
    GET_MOVIE_CARD_STATS_BY_HERO_ID_QUERY,
    CHECK_MOVIE_EXISTS_QUERY,
    INSERT_MOVIE_QUERY,
    UPDATE_MOVIE_TITLE_QUERY,
    UPDATE_MOVIE_NEED_REVIEW_QUERY,
    UPDATE_MOVIE_LOCKED_STATUS_QUERY,
    DELETE_MOVIE_QUERY
} from "../queries/movies.queries";

/**
 * Get movies by hero ID with card stats
 */
export async function getMoviesByHeroIdHandler(heroId: number): Promise<Response> {
    if (!heroId) {
        return jsonResponse({ success: false, data: null, message: "Missing heroId" }, 400);
    }

    try {
        const movies = await sql.unsafe(GET_MOVIE_CARD_STATS_BY_HERO_ID_QUERY, [heroId]);
        return jsonResponse({ success: true, data: movies, message: "Movies fetched" });
    } catch (error) {
        console.error("Error fetching movies:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to fetch movies" }, 500);
    }
}

export async function createMovieHandler(body: any): Promise<Response> {
    const { title, heroId, user } = body;
    if (!title || !heroId || !user) {
        return jsonResponse({ success: false, data: null, message: "Missing required fields" }, 400);
    }

    try {
        const exists = await sql.unsafe(CHECK_MOVIE_EXISTS_QUERY, [title, heroId]);
        if (exists && exists.length > 0) {
            return jsonResponse({ success: false, data: null, message: "Movie already exists" }, 409);
        }

        const movie = await sql.unsafe(INSERT_MOVIE_QUERY, [title, heroId, user]);
        return jsonResponse({ success: true, data: movie[0], message: "Movie created successfully" });
    } catch (error) {
        console.error("Error creating movie:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to create movie" }, 500);
    }
}

export async function updateMovieTitleHandler(id: number, body: any): Promise<Response> {
    const { title, user } = body;
    if (!title || !user) {
        return jsonResponse({ success: false, data: null, message: "Missing required fields" }, 400);
    }

    try {
        const movie = await sql.unsafe(UPDATE_MOVIE_TITLE_QUERY, [title, user, id]);
        return jsonResponse({ success: true, data: movie[0], message: "Movie updated successfully" });
    } catch (error) {
        console.error("Error updating movie:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to update movie" }, 500);
    }
}

export async function updateMovieReviewHandler(id: number, body: any): Promise<Response> {
    const { needReview, user } = body;
    if (needReview === undefined || !user) {
        return jsonResponse({ success: false, data: null, message: "Missing required fields" }, 400);
    }

    try {
        const movie = await sql.unsafe(UPDATE_MOVIE_NEED_REVIEW_QUERY, [needReview, user, id]);
        return jsonResponse({ success: true, data: movie[0], message: "Movie review status updated" });
    } catch (error) {
        console.error("Error updating movie review status:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to update movie review status" }, 500);
    }
}

export async function updateMovieLockedHandler(id: number, body: any): Promise<Response> {
    const { locked, user } = body;
    if (locked === undefined || !user) {
        return jsonResponse({ success: false, data: null, message: "Missing required fields" }, 400);
    }

    try {
        const movie = await sql.unsafe(UPDATE_MOVIE_LOCKED_STATUS_QUERY, [locked, user, id]);
        return jsonResponse({ success: true, data: movie[0], message: "Movie locked status updated" });
    } catch (error) {
        console.error("Error updating movie locked status:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to update movie locked status" }, 500);
    }
}

export async function deleteMovieHandler(id: number): Promise<Response> {
    try {
        const movie = await sql.unsafe(DELETE_MOVIE_QUERY, [id]);
        return jsonResponse({ success: true, data: movie[0], message: "Movie deleted successfully" });
    } catch (error) {
        console.error("Error deleting movie:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to delete movie" }, 500);
    }
}
