// Talkies game cards API handlers for CRUD operations

import { sql } from "bun";
import { jsonResponse } from "../../utils";
import { broadcast } from "../../lib/sse";
import {
    GET_CARDS_BY_HERO_AND_MOVIE_QUERY,
    GET_ALL_CARDS_BY_HERO_QUERY,
    INSERT_CARD_QUERY,
    UPDATE_CARD_QUERY,
    DELETE_CARD_QUERY,
    GET_CARD_BY_ID_QUERY,
    INSERT_CARD_TAGS_QUERY,
    DELETE_CARD_TAGS_QUERY
} from "../../queries/talkies/cards.queries";

function normalizeTags(card: any) {
    const tags = card.tags_json;
    if (!tags) return [];
    return typeof tags === "string" ? JSON.parse(tags) : tags;
}

export async function getCardsByHeroAndMovieHandler(heroId: number, movieId: number): Promise<Response> {
    if (!heroId || !movieId) {
        const missing = [];
        if (!heroId) missing.push('heroId');
        if (!movieId) missing.push('movieId');
        console.warn(`[getCardsByHeroAndMovie] Validation failed: Missing fields [${missing.join(', ')}]`);
        return jsonResponse({ success: false, data: null, message: `Missing required fields: ${missing.join(', ')}` }, 400);
    }

    try {
        const cards = await sql.unsafe(GET_CARDS_BY_HERO_AND_MOVIE_QUERY, [heroId, movieId]);
        const normalizedCards = cards.map((card: any) => {
            const { tags_json, ...rest } = card;
            return { ...rest, tags: normalizeTags(card) };
        });
        return jsonResponse({ success: true, data: normalizedCards, message: "Cards fetched successfully" });
    } catch (error) {
        console.error("Error fetching cards:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to fetch cards" }, 500);
    }
}

export async function getAllCardsByHeroHandler(heroId: number): Promise<Response> {
    if (!heroId) {
        console.warn(`[getAllCardsByHero] Validation failed: Missing heroId`);
        return jsonResponse({ success: false, data: null, message: "Missing heroId" }, 400);
    }

    try {
        const cards = await sql.unsafe(GET_ALL_CARDS_BY_HERO_QUERY, [heroId]);
        const normalizedCards = cards.map((card: any) => {
            const { tags_json, ...rest } = card;
            return { ...rest, tags: normalizeTags(card) };
        });
        return jsonResponse({ success: true, data: normalizedCards, message: "Cards fetched successfully" });
    } catch (error) {
        console.error("Error fetching cards:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to fetch cards" }, 500);
    }
}

export async function createCardHandler(body: any): Promise<Response> {
    // Support both camelCase and snake_case for compatibility
    const { name, type, call_sign, ability_text, ability_text2, user } = body;
    const heroId = body.heroId || body.hero_id;
    const movieId = body.movieId || body.movie_id;
    const tagIds = body.tagIds || body.tag_ids;

    if (!name || !type || !heroId || !movieId || !ability_text || !user) {
        const missing = [];
        if (!name) missing.push('name');
        if (!type) missing.push('type');
        if (!heroId) missing.push('heroId');
        if (!movieId) missing.push('movieId');
        if (!ability_text) missing.push('ability_text');
        if (!user) missing.push('user');
        console.warn(`[createCard] Validation failed: Missing fields [${missing.join(', ')}]`, { received: body });
        return jsonResponse({ success: false, data: null, message: `Missing required fields: ${missing.join(', ')}` }, 400);
    }

    try {
        const inserted = await sql.unsafe(INSERT_CARD_QUERY, [name, type, heroId, movieId, call_sign || null, ability_text, ability_text2 || null, user]);
        if (!inserted || inserted.length === 0) {
            return jsonResponse({ success: false, data: null, message: "Failed to create card" }, 500);
        }

        const cardId = inserted[0].id;
        const cleanTags = Array.isArray(tagIds)
            ? tagIds.map(Number).filter(Number.isInteger)
            : [];
        if (cleanTags.length > 0) {
            await sql.unsafe(INSERT_CARD_TAGS_QUERY, [cardId, `{${cleanTags.join(",")}}`]);
        }

        const cardRaw = await sql.unsafe(GET_CARD_BY_ID_QUERY, [cardId]);
        const { tags_json, ...card } = cardRaw[0];
        const result = { ...card, tags: normalizeTags(cardRaw[0]) };
        broadcast('talkies:cards', { action: 'create', heroId, movieId, cardId });
        return jsonResponse({ success: true, data: result, message: "Card created successfully" });
    } catch (error) {
        console.error("Error creating card:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to create card" }, 500);
    }
}

export async function updateCardHandler(id: number, body: any): Promise<Response> {
    // Support both camelCase and snake_case for compatibility
    const { name, type, call_sign, ability_text, ability_text2, need_review, user } = body;
    const tagIds = body.tagIds || body.tag_ids;

    if (!user) {
        return jsonResponse({ success: false, data: null, message: "Missing user field" }, 400);
    }

    try {
        const updated = await sql.unsafe(UPDATE_CARD_QUERY, [name || null, type || null, call_sign || null, ability_text || null, ability_text2 || null, need_review !== undefined ? need_review : null, user, id]);
        if (!updated || updated.length === 0) {
            return jsonResponse({ success: false, data: null, message: "Card not found" }, 404);
        }

        if (tagIds !== undefined) {
            await sql.unsafe(DELETE_CARD_TAGS_QUERY, [id]);
            const cleanTags = Array.isArray(tagIds)
                ? tagIds.map(Number).filter(Number.isInteger)
                : [];
            if (cleanTags.length > 0) {
                await sql.unsafe(INSERT_CARD_TAGS_QUERY, [id, `{${cleanTags.join(",")}}`]);
            }
        }

        const cardRaw = await sql.unsafe(GET_CARD_BY_ID_QUERY, [id]);
        const { tags_json, ...card } = cardRaw[0];
        const result = { ...card, tags: normalizeTags(cardRaw[0]) };
        broadcast('talkies:cards', { action: 'update', heroId: updated[0]?.hero_id, movieId: updated[0]?.movie_id, cardId: id });
        return jsonResponse({ success: true, data: result, message: "Card updated successfully" });
    } catch (error) {
        console.error("Error updating card:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to update card" }, 500);
    }
}

export async function deleteCardHandler(id: number): Promise<Response> {
    try {
        const deleted = await sql.unsafe(DELETE_CARD_QUERY, [id]);
        if (!deleted || deleted.length === 0) {
            return jsonResponse({ success: false, data: null, message: "Card not found" }, 404);
        }
        broadcast('talkies:cards', { action: 'delete', heroId: deleted[0]?.hero_id, movieId: deleted[0]?.movie_id, cardId: id });
        return jsonResponse({ success: true, data: { id: deleted[0].id }, message: "Card deleted successfully" });
    } catch (error) {
        console.error("Error deleting card:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to delete card" }, 500);
    }
}
