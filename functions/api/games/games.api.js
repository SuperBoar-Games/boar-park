import {
  GET_GAME_BY_SLUG_QUERY,
  GET_ALL_GAMES_QUERY,
  FETCH_GAME_ID_QUERY,
} from "../../../db/queries/games.queries.js";
import { APIResponse } from "../utils.js";

// Function to get a game by slug
/**
 * Retrieves a single game by its slug.
 *
 * @param {any} db - The database connection.
 * @param {string} slug - The slug of the game.
 * @returns {Promise<object|null>} - A promise resolving to the game or null if not found.
 */
export const getGameBySlug = async (db, slug) => {
  const res = await db.prepare(GET_GAME_BY_SLUG_QUERY).bind(slug).first();
  if (!res.success) {
    return APIResponse(false, null, "Game not found.");
  }
  return APIResponse(true, res, "Game fetched successfully.");
};

// Function to get all games
/**
 * Retrieves all games from the database.
 *
 * @param {any} db - The database connection.
 * @returns {Promise<Array>} - A promise resolving to an array of all games.
 */
export const getAllGames = async (db) => {
  const res = await db.prepare(GET_ALL_GAMES_QUERY).all();
  if (!res.success) {
    return APIResponse(false, [], "No games found.");
  }
  return APIResponse(true, res.results, "Games fetched successfully.");
};

// Function to get game ID by slug
/**
 * Retrieves the ID of a game by its slug.
 *
 * @param {any} db - The database connection.
 * @param {string} slug - The slug of the game.
 * @returns {Promise<number|null>} - A promise resolving to the game ID or null if not found.
 */
export const getGameIdBySlug = async (db, slug) => {
  const result = await db.prepare(FETCH_GAME_ID_QUERY).bind(slug).first();
  if (!result.success) {
    return APIResponse(false, null, "Game not found.");
  }
  return APIResponse(true, result.id, "Game ID fetched successfully.");
};
