// Card file upload, download, and management handlers

import { sql } from "bun";
import path from "path";
import { mkdir } from "fs/promises";
import { unlink } from "fs/promises";
import archiver from "archiver";
import { Readable } from "stream";
import { jsonResponse } from "../utils";
import { broadcast } from "../lib/sse";
import { requirePermission } from "../auth/permissions.middleware";
import { isAdmin, forbiddenResponse } from "../auth/middleware";
import { canViewGame } from "../auth/game-permissions";
import { signMediaPath } from "../auth/media-tokens";
import type { TokenPayload } from "../auth/jwt";
import {
    GET_CARD_FILES_QUERY,
    GET_MOVIE_FOR_CARD_QUERY,
    UPSERT_CARD_FILE_QUERY,
    DELETE_CARD_FILE_QUERY,
    UPDATE_MOVIE_FILES_LOCKED_QUERY,
    GET_FILES_FOR_MOVIE_QUERY,
    GET_FILES_FOR_HERO_QUERY,
} from "../queries/files.queries";

// Resolve media root from this file's location (src/handlers/ → project root)
const PROJECT_ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');

/*
 * Game-scoped access for file routes. Files hang off cards -> movies ->
 * heroes -> games, so the owning game is resolved from the requested resource
 * and checked before anything is returned.
 */
async function gameIdForHero(heroId: number): Promise<number | null> {
    const rows = await sql`SELECT game_id FROM heroes WHERE id = ${heroId}`;
    // game_id is bigint; the driver returns it as a string
    return rows.length ? Number((rows[0] as any).game_id) : null;
}

async function gameIdForMovie(movieId: number): Promise<number | null> {
    const rows = await sql`
        SELECT h.game_id FROM movies m
        JOIN heroes h ON h.id = m.hero_id
        WHERE m.id = ${movieId}`;
    return rows.length ? Number((rows[0] as any).game_id) : null;
}

async function gameIdForCard(cardId: number): Promise<number | null> {
    const rows = await sql`
        SELECT h.game_id FROM cards c
        JOIN heroes h ON h.id = c.hero_id
        WHERE c.id = ${cardId}`;
    return rows.length ? Number((rows[0] as any).game_id) : null;
}

/*
 * The driver cannot encode a JS array as an int[] bind parameter, so send a
 * Postgres array literal and let the query's ::int[] cast handle it. Values
 * are validated to be 1, 2 or 3 at the route and this stays a bound
 * parameter, so it is not an injection path.
 */
const toPgIntArray = (nums: number[]): string => `{${nums.join(',')}}`;

/** Returns a 403/404 Response when the user may not read this game, else null. */
async function denyIfNoGameAccess(
    user: TokenPayload,
    gameId: number | null,
): Promise<Response | null> {
    if (gameId === null) {
        return jsonResponse({ success: false, data: null, message: "Not found" }, 404);
    }
    if (!canViewGame(user, gameId)) {
        return forbiddenResponse("You don't have access to this game");
    }
    return null;
}

const MEDIA_ROOT = `${PROJECT_ROOT}/media/talkies/cards`;

const FILE_TYPE_NAMES: Record<number, string> = {
    1: 'design',
    2: 'image',
    3: 'print',
};

const ALLOWED_MIME_TYPE_2 = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const ALLOWED_EXT_TYPE_2 = new Set(['.png', '.jpg', '.jpeg', '.webp']);
// /media is served publicly by nginx with content-type from the extension, so
// anything a browser executes or renders as markup must never land there.
const FORBIDDEN_EXTS = new Set(['.html', '.htm', '.shtml', '.xhtml', '.svg', '.xml', '.js', '.mjs', '.cjs']);

// GET /api/cards/:cardId/files
export async function getCardFilesHandler(user: TokenPayload, cardId: number): Promise<Response> {
    try {
        const denied = await denyIfNoGameAccess(user, await gameIdForCard(cardId));
        if (denied) return denied;

        const files = await sql.unsafe(GET_CARD_FILES_QUERY, [cardId]);
        // Signed: the browser loads these via <img src>, which can't send
        // an Authorization header.
        const result = files.map((f: any) => ({
            ...f,
            url: signMediaPath(`/media/talkies/cards/${f.card_id}/${f.filename}`),
        }));
        return jsonResponse({ success: true, data: result, message: "Files fetched" });
    } catch (error) {
        console.error("[files] Error fetching card files:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to fetch files" }, 500);
    }
}

// POST /api/cards/:cardId/files
export async function uploadCardFileHandler(user: TokenPayload, cardId: number, request: Request): Promise<Response> {
    // Permission check
    if (!isAdmin(user)) {
        const forbidden = await requirePermission(user, 'files:create');
        if (forbidden) return forbidden;
    }

    // Check movie files_locked
    const movieRows = await sql.unsafe(GET_MOVIE_FOR_CARD_QUERY, [cardId]);
    if (!movieRows.length) {
        return jsonResponse({ success: false, data: null, message: "Card not found" }, 404);
    }
    const movie = movieRows[0] as any;
    if (movie.files_locked) {
        return jsonResponse({ success: false, data: null, message: "File uploads are locked for this movie" }, 403);
    }

    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return jsonResponse({ success: false, data: null, message: "Invalid multipart form data" }, 400);
    }

    const fileEntry = formData.get('file');
    const fileTypeStr = formData.get('file_type');

    if (!fileEntry || !(fileEntry instanceof File)) {
        return jsonResponse({ success: false, data: null, message: "Missing file" }, 400);
    }
    if (!fileTypeStr) {
        return jsonResponse({ success: false, data: null, message: "Missing file_type (1, 2, or 3)" }, 400);
    }

    const fileType = parseInt(String(fileTypeStr), 10);
    if (![1, 2, 3].includes(fileType)) {
        return jsonResponse({ success: false, data: null, message: "file_type must be 1, 2, or 3" }, 400);
    }

    const originalName = fileEntry.name;
    const ext = path.extname(originalName).toLowerCase() || '';
    const mimeType = fileEntry.type || '';

    // The client-supplied MIME type is not trustworthy — validate the
    // extension too, since nginx picks the served content-type from it.
    if (fileType === 2 && (!ALLOWED_MIME_TYPE_2.has(mimeType) || !ALLOWED_EXT_TYPE_2.has(ext))) {
        return jsonResponse({ success: false, data: null, message: "File type 2 must be a PNG, JPEG, or WebP image" }, 400);
    }
    if (FORBIDDEN_EXTS.has(ext)) {
        return jsonResponse({ success: false, data: null, message: `Files with ${ext} extension are not allowed` }, 400);
    }

    const baseName = FILE_TYPE_NAMES[fileType];
    const storedFilename = `${baseName}${ext}`;

    // Ensure directory exists
    const cardDir = `${MEDIA_ROOT}/${cardId}`;
    await mkdir(cardDir, { recursive: true });

    // Delete old file if different filename (e.g. old was .psd, new is .ai)
    try {
        const existing = await sql.unsafe(GET_CARD_FILES_QUERY, [cardId]);
        const existingFile = (existing as any[]).find((f: any) => f.file_type === fileType);
        if (existingFile && existingFile.filename !== storedFilename) {
            await unlink(`${cardDir}/${existingFile.filename}`).catch(() => {});
        }
    } catch { /* ignore */ }

    // Write file to disk
    const filePath = `${cardDir}/${storedFilename}`;
    const arrayBuffer = await fileEntry.arrayBuffer();
    await Bun.write(filePath, arrayBuffer);

    // Upsert DB record
    const rows = await sql.unsafe(UPSERT_CARD_FILE_QUERY, [
        cardId,
        fileType,
        storedFilename,
        originalName,
        mimeType || null,
        fileEntry.size,
        user.username,
    ]);

    const saved = rows[0] as any;
    broadcast('files:cards', { cardId });
    return jsonResponse({
        success: true,
        data: { ...saved, url: `/media/talkies/cards/${cardId}/${storedFilename}` },
        message: "File uploaded",
    }, 201);
}

// DELETE /api/cards/:cardId/files/:fileType
export async function deleteCardFileHandler(user: TokenPayload, cardId: number, fileType: number): Promise<Response> {
    if (!isAdmin(user)) {
        const forbidden = await requirePermission(user, 'files:delete');
        if (forbidden) return forbidden;
    }

    const movieRows = await sql.unsafe(GET_MOVIE_FOR_CARD_QUERY, [cardId]);
    if (!movieRows.length) {
        return jsonResponse({ success: false, data: null, message: "Card not found" }, 404);
    }
    const movie = movieRows[0] as any;
    if (movie.files_locked) {
        return jsonResponse({ success: false, data: null, message: "File uploads are locked for this movie" }, 403);
    }

    const deleted = await sql.unsafe(DELETE_CARD_FILE_QUERY, [cardId, fileType]);
    if (!deleted.length) {
        return jsonResponse({ success: false, data: null, message: "File not found" }, 404);
    }

    const filename = (deleted[0] as any).filename;
    await unlink(`${MEDIA_ROOT}/${cardId}/${filename}`).catch(() => {});
    broadcast('files:cards', { cardId });
    return jsonResponse({ success: true, data: null, message: "File deleted" });
}

// PATCH /api/movies/:movieId/files-lock — toggle files_locked
export async function toggleMovieFilesLockHandler(user: TokenPayload, movieId: number): Promise<Response> {
    const forbidden = await requirePermission(user, 'movies:update');
    if (forbidden) return forbidden;

    try {
        // Get current state
        const current = await sql.unsafe(
            'SELECT files_locked FROM movies WHERE id = $1',
            [movieId]
        );
        if (!current.length) {
            return jsonResponse({ success: false, data: null, message: "Movie not found" }, 404);
        }
        const newState = !(current[0] as any).files_locked;
        const rows = await sql.unsafe(UPDATE_MOVIE_FILES_LOCKED_QUERY, [newState, user.username, movieId]);
        return jsonResponse({ success: true, data: rows[0], message: `Files ${newState ? 'locked' : 'unlocked'}` });
    } catch (error) {
        console.error("[files] Error toggling files lock:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to toggle files lock" }, 500);
    }
}

// GET /api/movies/:movieId/download?types=1,2,3
export async function downloadMovieFilesHandler(user: TokenPayload, movieId: number, types: number[]): Promise<Response> {
    try {
        const denied = await denyIfNoGameAccess(user, await gameIdForMovie(movieId));
        if (denied) return denied;

        const files = await sql.unsafe(GET_FILES_FOR_MOVIE_QUERY, [movieId, toPgIntArray(types)]);
        if (!files.length) {
            return jsonResponse({ success: false, data: null, message: "No files found for the selected types" }, 404);
        }

        const movieTitle = (files[0] as any).movie_title || `movie-${movieId}`;
        const zipStream = buildZip(files as any[], movieTitle);

        return new Response(zipStream as any, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${sanitizeFilename(movieTitle)}-files.zip"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error("[files] Error building movie zip:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to build zip" }, 500);
    }
}

// GET /api/heroes/:heroId/download?types=1,2,3
export async function downloadHeroFilesHandler(user: TokenPayload, heroId: number, types: number[]): Promise<Response> {
    try {
        const denied = await denyIfNoGameAccess(user, await gameIdForHero(heroId));
        if (denied) return denied;

        const heroRows = await sql.unsafe('SELECT name FROM heroes WHERE id = $1', [heroId]);
        const heroName = heroRows.length ? (heroRows[0] as any).name : `hero-${heroId}`;

        const files = await sql.unsafe(GET_FILES_FOR_HERO_QUERY, [heroId, toPgIntArray(types)]);
        if (!files.length) {
            return jsonResponse({ success: false, data: null, message: "No files found for the selected types" }, 404);
        }

        const zipStream = buildZip(files as any[], null);

        return new Response(zipStream as any, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${sanitizeFilename(heroName)}-files.zip"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error("[files] Error building hero zip:", error);
        return jsonResponse({ success: false, data: null, message: "Failed to build zip" }, 500);
    }
}

// Build a zip ReadableStream from file rows
// Each row: { card_id, file_type, filename, card_name, movie_title }
function buildZip(files: any[], singleMovieTitle: string | null): Readable {
    const archive = archiver('zip', { zlib: { level: 6 } });

    for (const f of files) {
        const filePath = `${MEDIA_ROOT}/${f.card_id}/${f.filename}`;
        const movieFolder = sanitizeFilename(f.movie_title || 'unknown');
        const cardFolder = sanitizeFilename(f.card_name || `card-${f.card_id}`);
        const entryName = singleMovieTitle
            ? `${cardFolder}/${f.filename}`
            : `${movieFolder}/${cardFolder}/${f.filename}`;

        archive.file(filePath, { name: entryName });
    }

    archive.finalize();
    return archive;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._\- ]/g, '_').trim();
}
