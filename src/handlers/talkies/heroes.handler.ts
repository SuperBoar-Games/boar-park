// Talkies game heroes API handlers for CRUD operations

import { sql } from "bun";
import { jsonResponse } from "../../utils";
import {
    GET_HEROES_QUERY,
    CHECK_HERO_EXISTS_QUERY,
    GET_GAME_ID_BY_SLUG_QUERY,
    INSERT_HERO_QUERY,
    UPDATE_HERO_QUERY,
    DELETE_HERO_QUERY
} from "../../queries/talkies/heroes.queries";

export async function getHeroesHandler(): Promise<Response> {
    try {
        const heroes = await sql.unsafe(GET_HEROES_QUERY);
        return jsonResponse({ success: true, data: heroes, message: "Heroes fetched successfully" });
    } catch (error) {
        console.error("Error fetching heroes:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to fetch heroes" }, 500);
    }
}

export async function createHeroHandler(body: any): Promise<Response> {
    const { name, industry, gameSlug, user } = body;
    if (!name || !industry || !gameSlug || !user) {
        return jsonResponse({ success: false, data: null, message: "Missing required fields: name, industry, gameSlug, or user." }, 400);
    }

    try {
        const existing = await sql.unsafe(CHECK_HERO_EXISTS_QUERY, [name, industry]);
        if (existing[0]?.count > 0) {
            return jsonResponse({ success: false, data: null, message: "Hero already exists." }, 409);
        }

        const game = await sql.unsafe(GET_GAME_ID_BY_SLUG_QUERY, [gameSlug]);
        if (!game || game.length === 0) {
            return jsonResponse({ success: false, data: null, message: "Game not found." }, 404);
        }

        await sql.unsafe(INSERT_HERO_QUERY, [name, industry, game[0].id, user]);
        return jsonResponse({ success: true, data: null, message: "Hero created successfully." });
    } catch (error) {
        console.error("Error creating hero:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to create hero" }, 500);
    }
}

export async function updateHeroHandler(id: number, body: any): Promise<Response> {
    const { name, industry, user } = body;
    if (!name || !industry || !user) {
        return jsonResponse({ success: false, data: null, message: "Missing required fields: name, industry, or user." }, 400);
    }

    try {
        await sql.unsafe(UPDATE_HERO_QUERY, [name, industry, user, id]);
        return jsonResponse({ success: true, data: null, message: "Hero updated successfully." });
    } catch (error) {
        console.error("Error updating hero:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to update hero" }, 500);
    }
}

export async function deleteHeroHandler(id: number): Promise<Response> {
    try {
        await sql.unsafe(DELETE_HERO_QUERY, [id]);
        return jsonResponse({ success: true, data: null, message: "Hero deleted successfully." });
    } catch (error) {
        console.error("Error deleting hero:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to delete hero" }, 500);
    }
}
