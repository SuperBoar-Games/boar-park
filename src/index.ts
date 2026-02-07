// Main server entry point - Bun HTTP server with API route handlers and static file serving

import { getGamesHandler } from "./handlers/games.handler";
import { getGameHandler } from "./handlers/gameSlug.handler";
import {
    getHeroesHandler,
    createHeroHandler,
    updateHeroHandler,
    deleteHeroHandler
} from "./handlers/talkies/heroes.handler";
import {
    getMoviesByHeroIdHandler,
    createMovieHandler,
    updateMovieTitleHandler,
    updateMovieReviewHandler,
    updateMovieLockedHandler,
    deleteMovieHandler
} from "./handlers/talkies/movies.handler";
import {
    getCardsByHeroAndMovieHandler,
    getAllCardsByHeroHandler,
    createCardHandler,
    updateCardHandler,
    deleteCardHandler
} from "./handlers/talkies/cards.handler";
import {
    getTagsHandler,
    createTagHandler,
    updateTagHandler,
    deleteTagHandler,
    getTagCountsByHeroHandler
} from "./handlers/talkies/tags.handler";
import {
    signupHandler,
    loginHandler,
    refreshTokenHandler,
    logoutHandler,
    requestPasswordResetHandler,
    resetPasswordHandler,
    setPasswordHandler,
    getCurrentUserHandler,
    updateUserProfileHandler
} from "./handlers/auth.handler";
import {
    getAllUsersHandler,
    getPendingUsersHandler,
    approveUserHandler,
    disableUserHandler,
    createUserHandler,
    updateUserEmailHandler,
    updateUserUsernameHandler,
    deleteUserHandler,
    getAllRolesHandler,
    getAllGamesHandler as getAdminGamesHandler,
    assignRoleHandler,
    removeRoleHandler,
    getUserRolesHandler,
    sendResetEmailHandler
} from "./handlers/admin.handler";
import { authenticate, isAdmin, unauthorizedResponse, forbiddenResponse } from "./auth/middleware";
import { getGameIdFromSlug, canViewGame, canEditGame, getGamesForUser } from "./auth/game-permissions";

const PORT = process.env.PORT || 3000;
const TALKIES_GAME_SLUG = "talkies";

Bun.serve({
    port: PORT,
    async fetch(request: Request) {
        const url = new URL(request.url);
        const method = request.method;

        // CORS headers for development
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        // Handle OPTIONS preflight requests
        if (method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        // Health check
        if (url.pathname === "/health") {
            return new Response(JSON.stringify({ status: "ok" }), {
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // ========== AUTH ROUTES ==========
        if (url.pathname === "/api/auth/signup" && method === "POST") {
            const body = await request.json();
            return await signupHandler(body);
        }

        if (url.pathname === "/api/auth/login" && method === "POST") {
            const body = await request.json();
            return await loginHandler(body);
        }

        if (url.pathname === "/api/auth/refresh" && method === "POST") {
            const body = await request.json();
            return await refreshTokenHandler(body);
        }

        if (url.pathname === "/api/auth/logout" && method === "POST") {
            const body = await request.json();
            return await logoutHandler(body);
        }

        if (url.pathname === "/api/auth/request-reset" && method === "POST") {
            const body = await request.json();
            return await requestPasswordResetHandler(body);
        }

        if (url.pathname === "/api/auth/reset-password" && method === "POST") {
            const body = await request.json();
            return await resetPasswordHandler(body);
        }

        if (url.pathname === "/api/auth/set-password" && method === "POST") {
            const body = await request.json();
            return await setPasswordHandler(body);
        }

        if (url.pathname === "/api/auth/me" && method === "GET") {
            const user = await authenticate(request);
            if (!user) {
                return unauthorizedResponse();
            }
            return await getCurrentUserHandler(user.userId);
        }

        if (url.pathname === "/api/auth/me" && method === "PUT") {
            const user = await authenticate(request);
            if (!user) {
                return unauthorizedResponse();
            }
            const body = await request.json();
            return await updateUserProfileHandler(user.userId, body);
        }

        // ========== ADMIN ROUTES ==========
        if (url.pathname === "/api/admin/users" && method === "GET") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            return await getAllUsersHandler();
        }

        if (url.pathname === "/api/admin/users/pending" && method === "GET") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            return await getPendingUsersHandler();
        }

        if (url.pathname === "/api/admin/users" && method === "POST") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            const body = await request.json();
            return await createUserHandler(body);
        }

        // Match /api/admin/users/{id}/approve
        const approveUserMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/approve$/);
        if (approveUserMatch && method === "POST") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            const userId = parseInt(approveUserMatch[1]);
            return await approveUserHandler(userId);
        }

        // Match /api/admin/users/{id}/disable
        const disableUserMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/disable$/);
        if (disableUserMatch && method === "POST") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            const userId = parseInt(disableUserMatch[1]);
            return await disableUserHandler(userId);
        }

        // Match /api/admin/users/{id}/send-reset-email
        const sendResetEmailMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/send-reset-email$/);
        if (sendResetEmailMatch && method === "POST") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            const userId = parseInt(sendResetEmailMatch[1]);
            return await sendResetEmailHandler(userId);
        }

        // Match /api/admin/users/{id}/email
        const updateEmailMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/email$/);
        if (updateEmailMatch && method === "PUT") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            const userId = parseInt(updateEmailMatch[1]);
            const body = await request.json();
            return await updateUserEmailHandler(userId, body);
        }

        // Match /api/admin/users/{id}/username
        const updateUsernameMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/username$/);
        if (updateUsernameMatch && method === "PUT") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            const userId = parseInt(updateUsernameMatch[1]);
            const body = await request.json();
            return await updateUserUsernameHandler(userId, body);
        }

        // Match /api/admin/users/{id}
        const deleteUserMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
        if (deleteUserMatch && method === "DELETE") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            const userId = parseInt(deleteUserMatch[1]);
            return await deleteUserHandler(userId);
        }

        // Match /api/admin/users/{id}/roles
        const userRolesMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/roles$/);
        if (userRolesMatch && method === "GET") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            const userId = parseInt(userRolesMatch[1]);
            return await getUserRolesHandler(userId);
        }

        if (url.pathname === "/api/admin/roles" && method === "GET") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            return await getAllRolesHandler();
        }

        if (url.pathname === "/api/admin/games" && method === "GET") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            return await getAdminGamesHandler();
        }

        if (url.pathname === "/api/admin/assign-role" && method === "POST") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            const body = await request.json();
            return await assignRoleHandler(body);
        }

        if (url.pathname === "/api/admin/remove-role" && method === "POST") {
            const user = await authenticate(request);
            if (!user || !isAdmin(user)) {
                return forbiddenResponse("Admin access required");
            }
            const body = await request.json();
            return await removeRoleHandler(body);
        }

        // ========== GAMES ==========
        if (url.pathname === "/api/games" && method === "GET") {
            // Role-filtered: show only games user has access to
            const user = await authenticate(request);
            if (!user) {
                return unauthorizedResponse("Authentication required");
            }
            const games = await getGamesForUser(user);
            return new Response(JSON.stringify({ success: true, data: games }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // Match /api/games/{gameSlug} pattern
        const gameMatch = url.pathname.match(/^\/api\/games\/([^\/]+)$/);
        if (gameMatch && method === "GET") {
            const slug = gameMatch[1];
            const gameId = await getGameIdFromSlug(slug);

            if (!gameId) {
                return new Response(JSON.stringify({ success: false, message: "Game not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json", ...corsHeaders }
                });
            }

            const user = await authenticate(request);
            if (!user) {
                return unauthorizedResponse("Authentication required");
            }

            // Require viewer+ role for game
            if (!canViewGame(user, gameId)) {
                return forbiddenResponse("You don't have access to this game");
            }

            return await getGameHandler(slug);
        }

        // ========== TALKIES GAME ROUTES (PUBLIC) ==========
        // Match /api/talkies/heroes pattern
        if (url.pathname === "/api/talkies/heroes") {
            if (method === "GET") {
                return await getHeroesHandler();
            }
            if (method === "POST") {
                const body = await request.json();
                return await createHeroHandler({ ...body, gameSlug: TALKIES_GAME_SLUG });
            }
        }

        // Match /api/talkies/heroes/{id} pattern
        const heroIdMatch = url.pathname.match(/^\/api\/talkies\/heroes\/(\d+)$/);
        if (heroIdMatch) {
            const heroId = parseInt(heroIdMatch[1]);

            if (method === "PUT") {
                const body = await request.json();
                return await updateHeroHandler(heroId, body);
            }
            if (method === "DELETE") {
                return await deleteHeroHandler(heroId);
            }
        }

        // Match /api/talkies/movies pattern
        if (url.pathname === "/api/talkies/movies") {
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

        // Match /api/talkies/movies/{id} pattern
        const movieIdMatch = url.pathname.match(/^\/api\/talkies\/movies\/(\d+)$/);
        if (movieIdMatch) {
            const movieId = parseInt(movieIdMatch[1]);

            if (method === "PUT") {
                const body = await request.json();
                return await updateMovieTitleHandler(movieId, body);
            }
            if (method === "DELETE") {
                return await deleteMovieHandler(movieId);
            }
        }

        // Match /api/talkies/movies/{id}/review pattern
        const movieReviewMatch = url.pathname.match(/^\/api\/talkies\/movies\/(\d+)\/review$/);
        if (movieReviewMatch && method === "PATCH") {
            const movieId = parseInt(movieReviewMatch[1]);
            const body = await request.json();
            return await updateMovieReviewHandler(movieId, body);
        }

        // Match /api/talkies/movies/{id}/locked pattern
        const movieLockedMatch = url.pathname.match(/^\/api\/talkies\/movies\/(\d+)\/locked$/);
        if (movieLockedMatch && method === "PATCH") {
            const movieId = parseInt(movieLockedMatch[1]);
            const body = await request.json();
            return await updateMovieLockedHandler(movieId, body);
        }

        // Match /api/talkies/cards pattern
        if (url.pathname === "/api/talkies/cards") {
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

        // Match /api/talkies/cards/{id} pattern
        const cardIdMatch = url.pathname.match(/^\/api\/talkies\/cards\/(\d+)$/);
        if (cardIdMatch) {
            const cardId = parseInt(cardIdMatch[1]);

            if (method === "PUT") {
                const body = await request.json();
                return await updateCardHandler(cardId, body);
            }
            if (method === "DELETE") {
                return await deleteCardHandler(cardId);
            }
        }

        // Match /api/talkies/tags pattern
        if (url.pathname === "/api/talkies/tags") {
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

        // Match /api/talkies/tags/{id} pattern
        const tagIdMatch = url.pathname.match(/^\/api\/talkies\/tags\/(\d+)$/);
        if (tagIdMatch) {
            const tagId = parseInt(tagIdMatch[1]);

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
