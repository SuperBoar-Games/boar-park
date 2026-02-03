import { sql } from "bun";
import { jsonResponse } from "../utils";
import {
    GET_CARDS_BY_HERO_AND_MOVIE_QUERY,
    GET_ALL_CARDS_BY_HERO_QUERY,
    INSERT_CARD_QUERY,
    UPDATE_CARD_QUERY,
    DELETE_CARD_QUERY,
    GET_CARD_BY_ID_QUERY,
    INSERT_CARD_TAG_QUERY,
    DELETE_CARD_TAGS_QUERY
} from "../queries/cards.queries";

function normalizeTags(card: any) {
    if (!card.tag_ids || card.tag_ids.length === 0 || card.tag_ids[0] === null) return [];
    return card.tag_ids.map((id: any, index: number) => ({
        id,
        name: card.tag_names[index],
    })).filter((tag: any) => tag.id !== null);
}

export async function getCardsByHeroAndMovieHandler(heroId: number, movieId: number): Promise<Response> {
    if (!heroId || !movieId) {
        return jsonResponse({ success: false, data: null, message: "Missing heroId or movieId" }, 400);
    }

    try {
        const cards = await sql.unsafe(GET_CARDS_BY_HERO_AND_MOVIE_QUERY, [heroId, movieId]);
        const normalizedCards = cards.map((card: any) => {
            const { tag_ids, tag_names, ...rest } = card;
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
        return jsonResponse({ success: false, data: null, message: "Missing heroId" }, 400);
    }

    try {
        const cards = await sql.unsafe(GET_ALL_CARDS_BY_HERO_QUERY, [heroId]);
        const normalizedCards = cards.map((card: any) => {
            const { tag_ids, tag_names, ...rest } = card;
            return { ...rest, tags: normalizeTags(card) };
        });
        return jsonResponse({ success: true, data: normalizedCards, message: "Cards fetched successfully" });
    } catch (error) {
        console.error("Error fetching cards:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to fetch cards" }, 500);
    }
}

export async function createCardHandler(body: any): Promise<Response> {
    const { name, type, heroId, movieId, call_sign, ability_text, ability_text2, user, tagIds } = body;
    if (!name || !type || !heroId || !movieId || !ability_text || !user) {
        return jsonResponse({ success: false, data: null, message: "Missing required fields" }, 400);
    }

    try {
        const inserted = await sql.unsafe(INSERT_CARD_QUERY, [name, type, heroId, movieId, call_sign || null, ability_text, ability_text2 || null, user]);
        if (!inserted || inserted.length === 0) {
            return jsonResponse({ success: false, data: null, message: "Failed to create card" }, 500);
        }

        const cardId = inserted[0].id;
        if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
            for (const tagId of tagIds) {
                await sql.unsafe(INSERT_CARD_TAG_QUERY, [cardId, tagId]);
            }
        }

        const cardRaw = await sql.unsafe(GET_CARD_BY_ID_QUERY, [cardId]);
        const { tag_ids, tag_names, ...card } = cardRaw[0];
        const result = { ...card, tags: normalizeTags(cardRaw[0]) };
        return jsonResponse({ success: true, data: result, message: "Card created successfully" });
    } catch (error) {
        console.error("Error creating card:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to create card" }, 500);
    }
}

export async function updateCardHandler(id: number, body: any): Promise<Response> {
    const { name, type, call_sign, ability_text, ability_text2, need_review, user, tagIds } = body;
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
            if (Array.isArray(tagIds) && tagIds.length > 0) {
                for (const tagId of tagIds) {
                    await sql.unsafe(INSERT_CARD_TAG_QUERY, [id, tagId]);
                }
            }
        }

        const cardRaw = await sql.unsafe(GET_CARD_BY_ID_QUERY, [id]);
        const { tag_ids, tag_names, ...card } = cardRaw[0];
        const result = { ...card, tags: normalizeTags(cardRaw[0]) };
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
        return jsonResponse({ success: true, data: { id: deleted[0].id }, message: "Card deleted successfully" });
    } catch (error) {
        console.error("Error deleting card:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to delete card" }, 500);
    }
}
