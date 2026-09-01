// Signed, expiring URLs for uploaded media.
//
// The capability travels in the URL rather than an Authorization header,
// because the browser loads these through <img src>, which sends no headers,
// and access tokens live in localStorage rather than cookies. The signature
// covers the exact path plus an expiry, so a URL can't be altered to reach a
// different file and a leaked link stops working.

import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.JWT_ACCESS_SECRET || "";
/** Long enough to browse a movie's cards, short enough that a copied link dies. */
const DEFAULT_TTL_SECONDS = 60 * 60;

function sign(pathname: string, expires: number): string {
    return createHmac("sha256", SECRET)
        .update(`${pathname}:${expires}`)
        .digest("base64url");
}

/** Append `?exp=…&sig=…` to a media path. */
export function signMediaPath(pathname: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
    if (!SECRET) {
        // Failing closed would break every image; loudly degrade instead.
        console.warn("[media] JWT_ACCESS_SECRET unset — media URLs are unsigned");
        return pathname;
    }
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    return `${pathname}?exp=${expires}&sig=${sign(pathname, expires)}`;
}

export type MediaTokenResult = "ok" | "expired" | "invalid";

/** Validate the query parameters against the path being requested. */
export function verifyMediaToken(pathname: string, exp: string | null, sig: string | null): MediaTokenResult {
    if (!SECRET || !exp || !sig) return "invalid";

    const expires = Number(exp);
    if (!Number.isFinite(expires)) return "invalid";
    if (expires < Math.floor(Date.now() / 1000)) return "expired";

    const expected = Buffer.from(sign(pathname, expires));
    const provided = Buffer.from(sig);
    // Length must match before timingSafeEqual, which throws otherwise.
    if (expected.length !== provided.length) return "invalid";
    return timingSafeEqual(expected, provided) ? "ok" : "invalid";
}
