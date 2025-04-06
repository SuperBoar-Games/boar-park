// SQL Queries
export const GET_HEROES_QUERY = `
  SELECT
    h.*,
    COUNT(DISTINCT m.id) AS total_movies,
    COUNT(DISTINCT CASE WHEN m.status = 'PENDING' THEN m.id END) AS pending_movies,
    COUNT(DISTINCT c.id) AS total_cards
  FROM heroes h
  LEFT JOIN movies m ON m.hero_id = h.id
  LEFT JOIN cards c ON c.hero_id = h.id
  GROUP BY h.id
  ORDER BY h.category ASC, h.name ASC;
`;

export const CHECK_HERO_EXISTS_QUERY = `
  SELECT COUNT(*) AS count
  FROM heroes
  WHERE name = ? AND category = ?
`;

export const INSERT_HERO_QUERY = `
  INSERT INTO heroes (name, category, game_id, last_update_user)
  VALUES (?, ?, ?, ?)
`;

export const UPDATE_HERO_QUERY = `
  UPDATE heroes
  SET name = ?, category = ?, last_update_user = ?
  WHERE id = ?
`;

export const DELETE_HERO_QUERY = `
  DELETE FROM heroes
  WHERE id = ?
`;

import { FETCH_GAME_ID_QUERY } from "../gamesQueries.js";
import { APIResponse } from "../utils.js";

// Function to create a hero
/**
 * Creates a new hero in the database.
 *
 * @param {any} db - The database connection.
 * @param {object} body - The request body containing hero information.
 * @param {string} body.name - The name of the hero.
 * @param {string} body.industry - The industry/category of the hero.
 * @param {string} body.gameSlug - The slug of the associated game.
 * @param {string} body.user - The user performing the operation.
 * @returns {object} - A formatted response object.
 */
export const createHero = async (db, { name, industry, gameSlug, user }) => {
  if (!name || !industry || !gameSlug || !user) {
    return APIResponse(
      false,
      null,
      "Missing required fields: name, industry, gameSlug, or user."
    );
  }

  const { count } =
    (await db.prepare(CHECK_HERO_EXISTS_QUERY).bind(name, industry).first()) ||
    {};

  if (count > 0) {
    return APIResponse(false, null, "Hero already exists.");
  }

  const game = await db.prepare(FETCH_GAME_ID_QUERY).bind(gameSlug).first();
  if (!game) {
    return APIResponse(false, null, "Game not found.");
  }

  await db.prepare(INSERT_HERO_QUERY).bind(name, industry, game.id, user).run();

  return APIResponse(true, null, "Hero created successfully.");
};

// Function to update a hero
/**
 * Updates an existing hero in the database.
 * Note: The gameSlug will not be updated.
 *
 * @param {any} db - The database connection.
 * @param {object} body - The request body containing updated hero information.
 * @param {number} body.id - The ID of the hero to update.
 * @param {string} body.name - The new name of the hero.
 * @param {string} body.industry - The new industry/category of the hero.
 * @param {string} body.user - The user performing the operation.
 * @returns {object} - A formatted response object.
 */
export const updateHero = async (db, { id, name, industry, user }) => {
  if (!id || !name || !industry || !user) {
    return APIResponse(
      false,
      null,
      "Missing required fields: id, name, industry, or user."
    );
  }

  const resp = await db
    .prepare(UPDATE_HERO_QUERY)
    .bind(name, industry, user, id)
    .run();

  if (resp.changes === 0) {
    return APIResponse(false, null, "Hero not found or no changes made.");
  }

  return APIResponse(true, null, "Hero updated successfully.");
};

// Function to delete a hero
/**
 * Deletes a hero from the database.
 *
 * @param {any} db - The database connection.
 * @param {object} body - The request body containing hero ID.
 * @param {number} body.id - The ID of the hero to delete.
 * @returns {object} - A formatted response object.
 */
export const deleteHero = async (db, { id }) => {
  if (!id) {
    return APIResponse(false, null, "Missing required field: id.");
  }

  const resp = await db.prepare(DELETE_HERO_QUERY).bind(id).run();
  if (resp.changes === 0) {
    return APIResponse(false, null, "Hero not found or already deleted.");
  }
  // TODO: Optionally, delete associated movies and cards here

  return APIResponse(true, null, "Hero deleted successfully.");
};

// Function to get heroes with movie and card counts
/**
 * Retrieves a list of heroes including movie and card counts.
 *
 * @param {any} db - The database connection.
 * @returns {Promise<Array>} - A promise resolving to an array of heroes with stats.
 */
export const getHeroes = async (db, {}) => {
  const heroes = await db.prepare(GET_HEROES_QUERY).all();
  if (!heroes.success) {
    return APIResponse(false, null, "Failed to fetch heroes.");
  }
  return APIResponse(true, heroes.results, "Heroes fetched successfully.");
};
