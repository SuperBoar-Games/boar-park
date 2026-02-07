// Game API handlers for fetching game data

import { sql } from "bun";
import { jsonResponse } from "../utils";
import { GET_ALL_GAMES_QUERY } from "../queries/games.queries";

/**
 * Get all games
 */
export async function getGamesHandler(): Promise<Response> {
    try {
        const games = await sql.unsafe(GET_ALL_GAMES_QUERY);
        return jsonResponse({
            success: true,
            data: games,
            message: "Games fetched successfully",
        });
    } catch (error) {
        console.error("Error fetching games:", error);
        return jsonResponse(
            {
                success: false,
                data: null,
                message: "Failed to fetch games",
            },
            500
        );
    }
}
