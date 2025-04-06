// SQL Queries
export const GET_CARDS_BY_HERO_AND_MOVIE_ID_QUERY = `
  SELECT *
  FROM cards c
  WHERE c.hero_id = ? AND c.movie_id = ?
  ORDER BY c.id ASC, c.type ASC;
`;

export const CHECK_CARD_EXISTS_QUERY = `
  SELECT * FROM cards
  WHERE name = ? AND hero_id = ? AND movie_id = ?;
`;

export const INSERT_CARD_QUERY = `
  INSERT INTO cards (
    name, type, hero_id, movie_id, call_sign,
    ability_text, ability_text2, last_update_user
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?);
`;

export const UPDATE_CARD_QUERY = `
  UPDATE cards
  SET name = ?, type = ?, call_sign = ?, ability_text = ?, ability_text2 = ?, last_update_user = ?
  WHERE id = ?;
`;

export const UPDATE_CARD_NEED_REVIEW_QUERY = `
  UPDATE cards
  SET need_review = ?, last_update_user = ?
  WHERE id = ?;
`;

export const DELETE_CARD_QUERY = `
  DELETE FROM cards
  WHERE id = ?;
`;

import { APIResponse } from "../utils.js";

/**
 * Retrieves cards for a given hero and movie.
 *
 * @param {any} db - The database connection.
 * @param {object} params - Parameters including heroId and movieId.
 * @param {number} params.heroId - Hero ID.
 * @param {number} params.movieId - Movie ID.
 * @returns {Promise<object>} API response with list of cards or error.
 */
export const getCardsByHeroAndMovieId = async (db, { heroId, movieId }) => {
  if (!heroId || !movieId) {
    throw new Error("Missing heroId or movieId");
  }

  const cards = await db
    .prepare(GET_CARDS_BY_HERO_AND_MOVIE_ID_QUERY)
    .bind(heroId, movieId)
    .all();

  if (!cards.success) {
    return APIResponse(false, null, "Failed to fetch cards.");
  }

  return APIResponse(true, cards.results, "Cards fetched successfully.");
};

/**
 * Creates a new card.
 *
 * @param {any} db - The database connection.
 * @param {object} body - Card data.
 * @param {string} body.name - Card title.
 * @param {string} body.type - Card type.
 * @param {number|string} body.heroId - Hero ID.
 * @param {number|string} body.movieId - Movie ID.
 * @param {string} body.ability_text - Primary ability text.
 * @param {string} [body.ability_text2] - Secondary ability text (optional).
 * @param {string} [body.call_sign] - Optional call sign.
 * @param {string} body.gameSlug - Game slug to look up game ID.
 * @param {string} body.user - User performing the action.
 * @returns {Promise<object>} API response.
 */
export const createCard = async (
  db,
  {
    name,
    type,
    heroId,
    movieId,
    ability_text,
    ability_text2 = null,
    call_sign = null,
    user,
  }
) => {
  if (!name || !type || !heroId || !movieId || !ability_text || !user) {
    return APIResponse(false, null, "Missing required fields.");
  }

  const exists = await db
    .prepare(CHECK_CARD_EXISTS_QUERY)
    .bind(name, heroId, movieId)
    .first();

  if (exists) {
    return APIResponse(false, null, "Card already exists.");
  }

  const resp = await db
    .prepare(INSERT_CARD_QUERY)
    .bind(
      name,
      type,
      heroId,
      movieId,
      call_sign,
      ability_text,
      ability_text2,
      user
    )
    .run();

  if (!resp.success) {
    console.error("Failed to create card:", resp.error);
    return APIResponse(false, null, "Failed to create card.");
  }

  return APIResponse(true, null, "Card created successfully.");
};

/**
 * Updates an existing card.
 *
 * @param {any} db - The database connection.
 * @param {object} body - Card update payload.
 * @param {number} body.id - Card ID.
 * @param {string} body.name - Card title.
 * @param {string} body.type - Card type.
 * @param {string} body.ability_text - Primary ability text.
 * @param {string} [body.ability_text2] - Secondary ability text (optional).
 * @param {string} [body.call_sign] - Optional call sign.'
 * @param {boolean} body.need_review - Flag for review status.
 * @param {string} body.user - User performing the action.
 * @returns {Promise<object>} API response.
 */
export const updateCard = async (
  db,
  {
    cardId,
    name,
    type,
    ability_text,
    ability_text2 = null,
    call_sign = null,
    need_review,
    user,
  }
) => {
  if (!cardId || !user) {
    return APIResponse(false, null, "Missing required fields.");
  }

  // Optional fields check
  if (need_review === undefined && name === undefined) {
    return APIResponse(false, null, "No fields to update.");
  }

  // ✅ Update need_review if provided
  if (need_review !== undefined) {
    const resp = await db
      .prepare(UPDATE_CARD_NEED_REVIEW_QUERY)
      .bind(need_review, user, cardId)
      .run();

    if (!resp.success) {
      console.error("Failed to update card need_review:", resp.error);
      return APIResponse(false, null, "Failed to update card need_review.");
    }
  }

  // ✅ Update other fields if provided
  if (name !== undefined) {
    const resp = await db
      .prepare(UPDATE_CARD_QUERY)
      .bind(
        name ?? null,
        type ?? null,
        call_sign ?? null,
        ability_text ?? null,
        ability_text2 ?? null,
        user,
        cardId
      )
      .run();

    if (!resp.success) {
      console.error("Failed to update card:", resp.error);
      return APIResponse(false, null, "Failed to update card.");
    }
  }

  return APIResponse(true, null, "Card updated successfully.");
};

/**
 * Deletes a card by ID.
 *
 * @param {any} db - The database connection.
 * @param {object} body - Request body containing card ID.
 * @param {number} body.id - Card ID.
 * @returns {Promise<object>} API response.
 */
export const deleteCard = async (db, { cardId }) => {
  if (!cardId) {
    return APIResponse(false, null, "Missing card ID.");
  }

  const resp = await db.prepare(DELETE_CARD_QUERY).bind(cardId).run();

  if (!resp.success) {
    console.error("Failed to delete card:", resp.error);
    return APIResponse(false, null, "Failed to delete card.");
  }

  return APIResponse(true, null, "Card deleted successfully.");
};
