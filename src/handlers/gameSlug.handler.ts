import { sql } from "bun";
import { jsonResponse } from "../utils";
import { GET_GAME_BY_SLUG_QUERY } from "../queries/games.queries";

/**
 * Get a single game by slug
 */
export async function getGameHandler(slug: string): Promise<Response> {
    try {
        const result = await sql.unsafe(GET_GAME_BY_SLUG_QUERY, [slug]);

        if (!result || result.length === 0) {
            return jsonResponse(
                {
                    success: false,
                    data: null,
                    message: "Game not found",
                },
                404
            );
        }

        return jsonResponse({
            success: true,
            data: result[0],
            message: "Game fetched successfully",
        });
    } catch (error) {
        console.error("Error fetching game:", error);
        return jsonResponse(
            {
                success: false,
                data: null,
                message: "Failed to fetch game",
            },
            500
        );
    }
}
