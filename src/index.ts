import { sql } from "bun";
import { getGamesHandler } from "./handlers/games.handler";
import { getGameHandler } from "./handlers/gameSlug.handler";
import {
    getHeroesHandler,
    createHeroHandler,
    updateHeroHandler,
    deleteHeroHandler
} from "./handlers/heroes.handler";
import {
    getMoviesByHeroIdHandler,
    createMovieHandler,
    updateMovieTitleHandler,
    updateMovieReviewHandler,
    updateMovieLockedHandler,
    deleteMovieHandler
} from "./handlers/movies";
import {
    getCardsByHeroAndMovieHandler,
    getAllCardsByHeroHandler,
    createCardHandler,
    updateCardHandler,
    deleteCardHandler
} from "./handlers/cards";
import {
    getTagsHandler,
    createTagHandler,
    updateTagHandler,
    deleteTagHandler,
    getTagCountsByHeroHandler
} from "./handlers/tags";

const PORT = process.env.PORT || 3000;

// Helper to validate game slug
async function validateGameSlug(gameSlug: string): Promise<boolean> {
    try {
        const games = await sql`SELECT slug FROM games WHERE slug = ${gameSlug}`;
        return games.length > 0;
    } catch (error) {
        return false;
    }
}

Bun.serve({
    port: PORT,
    async fetch(request: Request) {
        const url = new URL(request.url);
        const method = request.method;

        // Health check
        if (url.pathname === "/health") {
            return new Response(JSON.stringify({ status: "ok" }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        // ========== GAMES ==========
        if (url.pathname === "/api/games" && method === "GET") {
            return await getGamesHandler();
        }

        // Match /api/games/{gameSlug} pattern
        const gameMatch = url.pathname.match(/^\/api\/games\/([^\/]+)$/);
        if (gameMatch && method === "GET") {
            const slug = gameMatch[1];
            return await getGameHandler(slug);
        }

        // Match /api/games/{gameSlug}/heroes pattern
        const heroesMatch = url.pathname.match(/^\/api\/games\/([^\/]+)\/heroes$/);
        if (heroesMatch) {
            const gameSlug = heroesMatch[1];
            if (!await validateGameSlug(gameSlug)) {
                return new Response(JSON.stringify({ success: false, message: "Game not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (method === "GET") {
                return await getHeroesHandler();
            }
            if (method === "POST") {
                const body = await request.json();
                return await createHeroHandler({ ...body, gameSlug });
            }
        }

        // Match /api/games/{gameSlug}/heroes/{id} pattern
        const heroIdMatch = url.pathname.match(/^\/api\/games\/([^\/]+)\/heroes\/(\d+)$/);
        if (heroIdMatch) {
            const gameSlug = heroIdMatch[1];
            const heroId = parseInt(heroIdMatch[2]);

            if (!await validateGameSlug(gameSlug)) {
                return new Response(JSON.stringify({ success: false, message: "Game not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (method === "PUT") {
                const body = await request.json();
                return await updateHeroHandler(heroId, body);
            }
            if (method === "DELETE") {
                return await deleteHeroHandler(heroId);
            }
        }

        // Match /api/games/{gameSlug}/movies pattern
        const moviesMatch = url.pathname.match(/^\/api\/games\/([^\/]+)\/movies$/);
        if (moviesMatch) {
            const gameSlug = moviesMatch[1];
            if (!await validateGameSlug(gameSlug)) {
                return new Response(JSON.stringify({ success: false, message: "Game not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (method === "GET") {
                const heroId = parseInt(url.searchParams.get("heroId") || "");
                if (heroId) {
                    return await getMoviesByHeroIdHandler(heroId);
                }
                return new Response("Missing heroId parameter", { status: 400 });
            }
            if (method === "POST") {
                const body = await request.json();
                return await createMovieHandler(body);
            }
        }

        // Match /api/games/{gameSlug}/movies/{id} pattern
        const movieIdMatch = url.pathname.match(/^\/api\/games\/([^\/]+)\/movies\/(\d+)$/);
        if (movieIdMatch) {
            const gameSlug = movieIdMatch[1];
            const movieId = parseInt(movieIdMatch[2]);

            if (!await validateGameSlug(gameSlug)) {
                return new Response(JSON.stringify({ success: false, message: "Game not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (method === "PUT") {
                const body = await request.json();
                return await updateMovieTitleHandler(movieId, body);
            }
            if (method === "DELETE") {
                return await deleteMovieHandler(movieId);
            }
        }

        // Match /api/games/{gameSlug}/movies/{id}/review pattern
        const movieReviewMatch = url.pathname.match(/^\/api\/games\/([^\/]+)\/movies\/(\d+)\/review$/);
        if (movieReviewMatch && method === "PATCH") {
            const gameSlug = movieReviewMatch[1];
            const movieId = parseInt(movieReviewMatch[2]);

            if (!await validateGameSlug(gameSlug)) {
                return new Response(JSON.stringify({ success: false, message: "Game not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            const body = await request.json();
            return await updateMovieReviewHandler(movieId, body);
        }

        // Match /api/games/{gameSlug}/movies/{id}/locked pattern
        const movieLockedMatch = url.pathname.match(/^\/api\/games\/([^\/]+)\/movies\/(\d+)\/locked$/);
        if (movieLockedMatch && method === "PATCH") {
            const gameSlug = movieLockedMatch[1];
            const movieId = parseInt(movieLockedMatch[2]);

            if (!await validateGameSlug(gameSlug)) {
                return new Response(JSON.stringify({ success: false, message: "Game not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            const body = await request.json();
            return await updateMovieLockedHandler(movieId, body);
        }

        // Match /api/games/{gameSlug}/cards pattern
        const cardsMatch = url.pathname.match(/^\/api\/games\/([^\/]+)\/cards$/);
        if (cardsMatch) {
            const gameSlug = cardsMatch[1];
            if (!await validateGameSlug(gameSlug)) {
                return new Response(JSON.stringify({ success: false, message: "Game not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (method === "GET") {
                const heroId = parseInt(url.searchParams.get("heroId") || "");
                const movieId = parseInt(url.searchParams.get("movieId") || "");

                if (heroId && movieId) {
                    return await getCardsByHeroAndMovieHandler(heroId, movieId);
                } else if (heroId) {
                    return await getAllCardsByHeroHandler(heroId);
                }
                return new Response("Missing heroId parameter", { status: 400 });
            }
            if (method === "POST") {
                const body = await request.json();
                return await createCardHandler(body);
            }
        }

        // Match /api/games/{gameSlug}/cards/{id} pattern
        const cardIdMatch = url.pathname.match(/^\/api\/games\/([^\/]+)\/cards\/(\d+)$/);
        if (cardIdMatch) {
            const gameSlug = cardIdMatch[1];
            const cardId = parseInt(cardIdMatch[2]);

            if (!await validateGameSlug(gameSlug)) {
                return new Response(JSON.stringify({ success: false, message: "Game not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (method === "PUT") {
                const body = await request.json();
                return await updateCardHandler(cardId, body);
            }
            if (method === "DELETE") {
                return await deleteCardHandler(cardId);
            }
        }

        // Match /api/games/{gameSlug}/tags pattern
        const tagsMatch = url.pathname.match(/^\/api\/games\/([^\/]+)\/tags$/);
        if (tagsMatch) {
            const gameSlug = tagsMatch[1];
            if (!await validateGameSlug(gameSlug)) {
                return new Response(JSON.stringify({ success: false, message: "Game not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (method === "GET") {
                const heroId = url.searchParams.get("heroId");
                if (heroId) {
                    return await getTagCountsByHeroHandler(parseInt(heroId));
                }
                return await getTagsHandler();
            }
            if (method === "POST") {
                const body = await request.json();
                return await createTagHandler(body);
            }
        }

        // Match /api/games/{gameSlug}/tags/{id} pattern
        const tagIdMatch = url.pathname.match(/^\/api\/games\/([^\/]+)\/tags\/(\d+)$/);
        if (tagIdMatch) {
            const gameSlug = tagIdMatch[1];
            const tagId = parseInt(tagIdMatch[2]);

            if (!await validateGameSlug(gameSlug)) {
                return new Response(JSON.stringify({ success: false, message: "Game not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (method === "PUT") {
                const body = await request.json();
                return await updateTagHandler(tagId, body);
            }
            if (method === "DELETE") {
                return await deleteTagHandler(tagId);
            }
        }

        // Serve static files from /frontend directory
        try {
            let filePath = url.pathname === "/"
                ? "/home/batsy/web/sb/boar-park/frontend/index.html"
                : `/home/batsy/web/sb/boar-park/frontend${url.pathname}`;

            // If path ends with / or is a directory, append index.html
            if (url.pathname.endsWith('/') || !url.pathname.includes('.')) {
                if (!filePath.endsWith('index.html')) {
                    filePath = filePath.endsWith('/') ? `${filePath}index.html` : `${filePath}/index.html`;
                }
            }

            const file = Bun.file(filePath);
            if (await file.exists()) {
                return new Response(file);
            }
        } catch (error) {
            // File not found, continue to 404
        }

        // 404
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`🚀 Server running at http://localhost:${PORT}`);
console.log(`📊 Database: ${process.env.DATABASE_URL || "PostgreSQL (auto-detected)"}`);
