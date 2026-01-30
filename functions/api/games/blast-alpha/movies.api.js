import {
  GET_MOVIE_CARD_STATS_BY_HERO_ID_QUERY,
  CHECK_MOVIE_EXISTS_QUERY,
  INSERT_MOVIE_QUERY,
  UPDATE_MOVIE_TITLE_QUERY,
  UPDATE_MOVIE_NEED_REVIEW_QUERY,
  UPDATE_MOVIE_LOCKED_STATUS_QUERY,
  DELETE_MOVIE_QUERY,
} from "../../../../db/queries/blast-alpha/movies.queries.js";
import { APIResponse } from "../../utils.js";

/**
 * Retrieves movies associated with a given hero.
 *
 * @param {any} db - The database connection.
 * @param {object} queryParams - Query parameters.
 * @param {number} queryParams.heroId - The ID of the hero.
 * @returns {Promise<object>} API response with list of movies or error.
 */
export const getMoviesByHeroId = async (db, { heroId }) => {
  if (!heroId) throw new Error("Missing heroId");

  const movieStats = await db
    .prepare(GET_MOVIE_CARD_STATS_BY_HERO_ID_QUERY)
    .bind(heroId)
    .all();

  return APIResponse(true, movieStats.results ?? [], "Movies fetched");
};


/**
 * Creates a new movie for a hero.
 *
 * @param {any} db - The database connection.
 * @param {object} body - The request body.
 * @param {string} body.title - Movie title.
 * @param {number} body.heroId - Associated hero ID.
 * @param {string} body.user - The user performing the operation.
 * @returns {Promise<object>} API response with success or error.
 */
export const createMovie = async (db, { title, heroId, user }) => {
  if (!title || !heroId || !user) {
    return APIResponse(false, null, "Missing required fields");
  }

  const exists = await db
    .prepare(CHECK_MOVIE_EXISTS_QUERY)
    .bind(title, heroId)
    .first();

  if (exists) {
    return APIResponse(false, null, "Movie already exists");
  }

  const movie = await db
    .prepare(INSERT_MOVIE_QUERY)
    .bind(title, heroId, user)
    .first();

  if (!movie) {
    return APIResponse(false, null, "Failed to create movie");
  }

  return APIResponse(true, movie, "Movie created");
};


/**
 * Updates an existing movie.
 *
 * @param {any} db - The database connection.
 * @param {object} body - The request body.
 * @param {number} body.id - Movie ID.
 * @param {string} body.title - New movie title.
 * @param {string} body.user - The user performing the operation.
 * @returns {Promise<object>} API response with success or error.
 */
export const updateMovie = async (
  db,
  { id, title, need_review, user }
) => {
  if (!id || !user) {
    return APIResponse(false, null, "Missing id or user");
  }

  let movie = null;

  if (need_review !== undefined) {
    movie = await db
      .prepare(UPDATE_MOVIE_NEED_REVIEW_QUERY)
      .bind(need_review, user, id)
      .first();

    if (!movie) {
      return APIResponse(false, null, "Failed to update need_review");
    }
  }

  if (title !== undefined) {
    movie = await db
      .prepare(UPDATE_MOVIE_TITLE_QUERY)
      .bind(title, user, id)
      .first();

    if (!movie) {
      return APIResponse(false, null, "Failed to update title");
    }
  }

  return APIResponse(true, movie, "Movie updated");
};


/**
 * Deletes a movie by ID.
 *
 * @param {any} db - The database connection.
 * @param {object} body - The request body.
 * @param {number} body.id - Movie ID to delete.
 * @returns {Promise<object>} API response with success or error.
 */
export const deleteMovie = async (db, { id }) => {
  if (!id) {
    return APIResponse(false, null, "Missing id");
  }

  const movie = await db
    .prepare(DELETE_MOVIE_QUERY)
    .bind(id)
    .first();

  if (!movie) {
    return APIResponse(false, null, "Movie not found or delete failed");
  }

  return APIResponse(true, movie, "Movie deleted");
};


export const updateMovieLockedStatus = async (db, { id, locked, user }, env) => {
  if (id === undefined || locked === undefined || !user) {
    return APIResponse(false, null, "Missing id, locked status, or user");
  }

  if (!locked) {
    const allowedUsers = (env.BOARS || "").split(",").map(u => u.trim());
    if (!allowedUsers.includes(user)) {
      return APIResponse(false, null, "User not authorized to update locked status");
    }
  }

  const movie = await db
    .prepare(UPDATE_MOVIE_LOCKED_STATUS_QUERY)
    .bind(locked, user, id)
    .first();

  if (!movie) {
    return APIResponse(false, null, "Failed to update locked status");
  }

  return APIResponse(true, movie, "Movie locked status updated");
};

