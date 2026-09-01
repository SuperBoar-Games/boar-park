// Authenticated file downloads.
//
// The ZIP endpoints are behind `authenticate()`, which reads the Authorization
// header, but access tokens live in localStorage — not cookies. So the obvious
// `window.location.href = url` is a plain browser navigation that carries no
// header and the server answers 401: the download silently did nothing.
//
// Fetching with the header and handing the browser a blob is the way to attach
// credentials to a download.

interface DownloadResult {
    ok: boolean;
    /** Human-readable reason, present when ok is false */
    error?: string;
}

/**
 * Fetch `url` with the bearer token and save the response as a file.
 * Honours the server's Content-Disposition filename when it sends one.
 */
export async function downloadWithAuth(
    url: string,
    accessToken: string | null,
    fallbackFilename: string,
): Promise<DownloadResult> {
    let objectUrl: string | undefined;
    try {
        const response = await fetch(url, {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });

        if (!response.ok) {
            // The endpoint answers JSON on failure; fall back to the status if
            // the body isn't JSON (a proxy error page, say).
            const body = await response.json().catch(() => null);
            return {
                ok: false,
                error: body?.message
                    || (response.status === 401
                        ? 'Your session expired. Sign in again to download.'
                        : `Download failed (${response.status})`),
            };
        }

        const blob = await response.blob();
        if (blob.size === 0) {
            return { ok: false, error: 'Nothing to download — no files matched.' };
        }

        objectUrl = URL.createObjectURL(blob);
        const filename = response.headers
            .get('Content-Disposition')
            ?.match(/filename="?([^";]+)"?/)?.[1];

        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename || fallbackFilename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        return { ok: true };
    } catch {
        return { ok: false, error: 'Download failed. Check your connection and try again.' };
    } finally {
        // Revoking immediately is safe: click() has already handed the blob to
        // the download manager. Leaving it holds the whole ZIP in memory.
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
}
