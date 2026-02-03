/**
 * API helper functions for Talkies game
 * All API calls go through the new RESTful endpoints
 */

const GAME_SLUG = 'talkies';
const BASE_URL = `/api/games/${GAME_SLUG}`;

// Helper to get user email from header or localStorage
function getUserEmail() {
    return localStorage.getItem('userEmail') || 'admin@example.com';
}

// Generic JSON request helper
async function jsonRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// ========== HEROES ==========
export async function getHeroes() {
    return jsonRequest(`${BASE_URL}/heroes`);
}

export async function createHero(data) {
    return jsonRequest(`${BASE_URL}/heroes`, {
        method: 'POST',
        body: JSON.stringify({
            ...data,
            gameSlug: GAME_SLUG,
            user: getUserEmail()
        })
    });
}

export async function updateHero(heroId, data) {
    return jsonRequest(`${BASE_URL}/heroes/${heroId}`, {
        method: 'PUT',
        body: JSON.stringify({
            ...data,
            user: getUserEmail()
        })
    });
}

export async function deleteHero(heroId) {
    return jsonRequest(`${BASE_URL}/heroes/${heroId}`, {
        method: 'DELETE'
    });
}

// ========== MOVIES ==========
export async function getMoviesByHeroId(heroId) {
    return jsonRequest(`${BASE_URL}/movies?heroId=${heroId}`);
}
export async function getMovieById(heroId, movieId) {
    const res = await getMoviesByHeroId(heroId);
    const movie = res.data?.find(m => String(m.id) === String(movieId));
    return movie || null;
}
export async function createMovie(data) {
    return jsonRequest(`${BASE_URL}/movies`, {
        method: 'POST',
        body: JSON.stringify({
            ...data,
            user: getUserEmail()
        })
    });
}

export async function updateMovieTitle(movieId, data) {
    return jsonRequest(`${BASE_URL}/movies/${movieId}`, {
        method: 'PUT',
        body: JSON.stringify({
            ...data,
            user: getUserEmail()
        })
    });
}

export async function updateMovieReview(movieId, needReview) {
    return jsonRequest(`${BASE_URL}/movies/${movieId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({
            needReview,
            user: getUserEmail()
        })
    });
}

export async function updateMovieLocked(movieId, locked) {
    return jsonRequest(`${BASE_URL}/movies/${movieId}/locked`, {
        method: 'PATCH',
        body: JSON.stringify({
            locked,
            user: getUserEmail()
        })
    });
}

export async function deleteMovie(movieId) {
    return jsonRequest(`${BASE_URL}/movies/${movieId}`, {
        method: 'DELETE'
    });
}

// ========== CARDS ==========
export async function getCardsByHeroAndMovie(heroId, movieId) {
    return jsonRequest(`${BASE_URL}/cards?heroId=${heroId}&movieId=${movieId}`);
}

export async function getAllCardsByHero(heroId) {
    return jsonRequest(`${BASE_URL}/cards?heroId=${heroId}`);
}

export async function createCard(data) {
    return jsonRequest(`${BASE_URL}/cards`, {
        method: 'POST',
        body: JSON.stringify({
            ...data,
            user: getUserEmail()
        })
    });
}

export async function updateCard(cardId, data) {
    return jsonRequest(`${BASE_URL}/cards/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify({
            ...data,
            user: getUserEmail()
        })
    });
}

export async function deleteCard(cardId) {
    return jsonRequest(`${BASE_URL}/cards/${cardId}`, {
        method: 'DELETE'
    });
}

// ========== TAGS ==========
export async function getTags() {
    return jsonRequest(`${BASE_URL}/tags`);
}
export async function getTagCountsByHero(heroId) {
    return jsonRequest(`${BASE_URL}/tags?heroId=${heroId}`);
}
export async function createTag(name) {
    return jsonRequest(`${BASE_URL}/tags`, {
        method: 'POST',
        body: JSON.stringify({ name })
    });
}

export async function updateTag(tagId, name) {
    return jsonRequest(`${BASE_URL}/tags/${tagId}`, {
        method: 'PUT',
        body: JSON.stringify({ name })
    });
}

export async function deleteTag(tagId) {
    return jsonRequest(`${BASE_URL}/tags/${tagId}`, {
        method: 'DELETE'
    });
}
