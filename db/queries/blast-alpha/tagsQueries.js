export const GET_ALL_TAGS_QUERY = `
  SELECT *
  FROM tags
  ORDER BY name ASC;
`;

export const ADD_NEW_TAG_QUERY = `
  INSERT INTO tags (name)
VALUES (?);
`;

export const DELETE_TAG_BY_ID_QUERY = `
  DELETE FROM tags
  WHERE id = ?;
`;

export const UPDATE_TAG_NAME_BY_ID_QUERY = `
  UPDATE tags
  SET name = ?
  WHERE id = ?;
`;

export const GET_TAGS_BY_CARD_ID_QUERY = `
  SELECT t.*
  FROM tags t
  JOIN card_tags ct ON ct.tag_id = t.id
  WHERE ct.card_id = ?
  ORDER BY t.name ASC;
`;

export const INSERT_CARD_TAGS_QUERY = `
  INSERT OR IGNORE INTO card_tags (card_id, tag_id)
  SELECT ?, id
  FROM tags
  WHERE name IN (%s);
`;

export const DELETE_CARD_TAGS_BY_CARD_ID_QUERY = `
  DELETE FROM card_tags
  WHERE card_id = ?;
`;

export const GET_CARDS_BY_HERO_AND_MOVIE_ID_QUERY = `
  SELECT
    c.*,
    GROUP_CONCAT(t.name) AS tags
  FROM cards c
  LEFT JOIN card_tags ct ON ct.card_id = c.id
  LEFT JOIN tags t ON t.id = ct.tag_id
  WHERE c.hero_id = ? AND c.movie_id = ?
  GROUP BY c.id
  ORDER BY c.id ASC, c.type ASC;
`;

export const GET_ALL_CARDS_BY_HERO_ID_QUERY = `
  SELECT
    c.*,
    m.title AS movie_title,
    GROUP_CONCAT(t.name) AS tags
  FROM cards c
  LEFT JOIN movies m ON c.movie_id = m.id
  LEFT JOIN card_tags ct ON ct.card_id = c.id
  LEFT JOIN tags t ON t.id = ct.tag_id
  WHERE c.hero_id = ?
  GROUP BY c.id
  ORDER BY c.id ASC, c.type ASC;
`;

export const GET_CARD_COUNTS_BY_TAG_ID_QUERY = `
  SELECT
    t.id AS tag_id,
    t.name AS tag_name,
    COUNT(ct.card_id) AS card_count
  FROM tags t
  LEFT JOIN card_tags ct ON ct.tag_id = t.id
  GROUP BY t.id
  ORDER BY t.name ASC;
`;


import { APIResponse } from "../utils.js";

/**
 * Retrieves tags associated with a specific card ID.
 *
 * @param {any} db - The database connection.
 * @param {object} params - Parameters including cardId.
 * @param {number} params.cardId - Card ID.
 * @returns {Promise<object>} API response with list of tags or error.
 */
export const getTagsByCardId = async (db, { cardId }) => {
  if (!cardId) {
    throw new Error("Missing cardId");
  }

  const tags = await db
    .prepare(GET_TAGS_BY_CARD_ID_QUERY)
    .bind(cardId)
    .all();

  if (!tags.success) {
    return APIResponse(false, null, "Failed to fetch tags.");
  }

  return APIResponse(true, tags.results, "Tags fetched successfully.");
};

/**
 * Sets tags for a specific card by replacing existing tags with new ones.
 *
 * @param {any} db - The database connection.
 * @param {object} params - Parameters including cardId and tags.
 * @param {number} params.cardId - Card ID.
 * @param {Array<string>} params.tags - Array of tag names to set for the card.
 * @returns {Promise<object>} API response indicating success or failure.
 */
export const setTagsForCard = async (db, { cardId, tags }) => {
  if (!cardId || !Array.isArray(tags)) {
    return APIResponse(false, null, "Invalid cardId or tags.");
  }

  // 1. Clear existing tags
  await db
    .prepare(DELETE_CARD_TAGS_BY_CARD_ID_QUERY)
    .bind(cardId)
    .run();

  if (tags.length === 0) {
    return APIResponse(true, null, "Tags cleared.");
  }

  // 2. Insert new tags
  const placeholders = tags.map(() => "?").join(",");
  const query = INSERT_CARD_TAGS_QUERY.replace("%s", placeholders);

  const resp = await db
    .prepare(query)
    .bind(cardId, ...tags)
    .run();

  if (!resp.success) {
    console.error("Failed to assign tags:", resp.error);
    return APIResponse(false, null, "Failed to assign tags.");
  }

  return APIResponse(true, null, "Tags updated successfully.");
};

/**
 * Retrieves all tags from the database.
 *
 * @param {any} db - The database connection.
 * @returns {Promise<object>} API response with list of tags or error.
 */
export const getAllTags = async (db) => {
  const tags = await db.prepare(GET_ALL_TAGS_QUERY).all();

  if (!tags.success) {
    return APIResponse(false, null, "Failed to fetch tags.");
  }

  return APIResponse(true, tags.results, "Tags fetched successfully.");
};

/**
 * Adds a new tag to the database.
 *
 * @param {any} db - The database connection.
 * @param {object} params - Parameters including name.
 * @param {string} params.name - Name of the new tag.
 * @returns {Promise<object>} API response indicating success or failure.
 */
export const createTag = async (db, { name }) => {
  if (!name) {
    return APIResponse(false, null, "Tag name is required.");
  }

  const resp = await db
    .prepare(ADD_NEW_TAG_QUERY)
    .bind(name)
    .run();

  if (!resp.success) {
    return APIResponse(false, null, "Failed to add new tag.");
  }

  return APIResponse(true, { id: resp.lastInsertRowid, name }, "Tag added successfully.");
};

/**
 * Deletes a tag by its ID.
 *
 * @param {any} db - The database connection.
 * @param {object} params - Parameters including tagId.
 * @param {number} params.tagId - ID of the tag to delete.
 * @returns {Promise<object>} API response indicating success or failure.
 */
export const deleteTag = async (db, { tagId }) => {
  if (!tagId) {
    return APIResponse(false, null, "Tag ID is required.");
  }

  const resp = await db
    .prepare(DELETE_TAG_BY_ID_QUERY)
    .bind(tagId)
    .run();

  if (!resp.success) {
    return APIResponse(false, null, "Failed to delete tag.");
  }

  return APIResponse(true, null, "Tag deleted successfully.");
};

/**
 * Updates the name of a tag by its ID.
 *
 * @param {any} db - The database connection.
 * @param {object} params - Parameters including tagId and new name.
 * @param {number} params.tagId - ID of the tag to update.
 * @param {string} params.name - New name for the tag.
 * @returns {Promise<object>} API response indicating success or failure.
 */
export const updateTag = async (db, { tagId, name }) => {
  if (!tagId || !name) {
    return APIResponse(false, null, "Tag ID and new name are required.");
  }

  const resp = await db
    .prepare(UPDATE_TAG_NAME_BY_ID_QUERY)
    .bind(name, tagId)
    .run();

  if (!resp.success) {
    return APIResponse(false, null, "Failed to update tag name.");
  }

  return APIResponse(true, null, "Tag name updated successfully.");
};

/**
 * Retrieves all tags associated with cards for a specific hero and movie.
 *
 * @param {any} db - The database connection.
 * @param {object} params - Parameters including heroId and movieId.
 * @param {number} params.heroId - Hero ID.
 * @param {number} params.movieId - Movie ID.
 * @returns {Promise<object>} API response with list of cards and their tags or error.
 */
export const getCardsByHeroAndMovieId = async (db, { heroId, movieId }) => {
  if (!heroId || !movieId) {
    return APIResponse(false, null, "Missing heroId or movieId.");
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
 * Retrieves all cards associated with tags for a specific hero.
 *
 * @param {any} db - The database connection.
 * @param {object} params - Parameters including heroId.
 * @param {number} params.heroId - Hero ID.
 * @returns {Promise<object>} API response with list of cards and their tags or error.
 */
export const getAllCardsByHeroId = async (db, { heroId }) => {
  if (!heroId) {
    return APIResponse(false, null, "Missing heroId.");
  }

  const cards = await db
    .prepare(GET_ALL_CARDS_BY_HERO_ID_QUERY)
    .bind(heroId)
    .all();

  if (!cards.success) {
    return APIResponse(false, null, "Failed to fetch cards.");
  }

  return APIResponse(true, cards.results, "Cards fetched successfully.");
};

/**
 * Retrieves counts of cards associated with each tag.
 *
 * @param {any} db - The database connection.
 * @returns {Promise<object>} API response with list of tags and their card counts or error.
 */
export const getCardCountsByTagId = async (db) => {
  const counts = await db.prepare(GET_CARD_COUNTS_BY_TAG_ID_QUERY).all();

  if (!counts.success) {
    return APIResponse(false, null, "Failed to fetch card counts.");
  }

  return APIResponse(true, counts.results, "Card counts fetched successfully.");
};

