// SQL Queries
export const GET_MOVIES_BY_HERO_ID_QUERY = `
  SELECT *
  FROM movies
  WHERE hero_id = ?;
`;

export const CHECK_MOVIE_EXISTS_QUERY = `
  SELECT * FROM movies WHERE title = ? AND hero_id = ?;
`;

export const INSERT_MOVIE_QUERY = `
  INSERT INTO movies (title, hero_id, last_update_user)
  VALUES (?, ?, ?);
`;

export const UPDATE_MOVIE_TITLE_QUERY = `
  UPDATE movies
  SET title = ?, last_update_user = ?
  WHERE id = ?;
`;

export const UPDATE_MOVIE_NEED_REVIEW_QUERY = `
  UPDATE movies
  SET need_review = ?, last_update_user = ?
  WHERE id = ?;
`;

export const DELETE_MOVIE_QUERY = `
  DELETE FROM movies
  WHERE id = ?;
`;

import { APIResponse } from "../utils.js";

/**
 * Retrieves movies associated with a given hero.
 *
 * @param {any} db - The database connection.
 * @param {object} queryParams - Query parameters.
 * @param {number} queryParams.heroId - The ID of the hero.
 * @returns {Promise<object>} API response with list of movies or error.
 */
export const getMoviesByHeroId = async (db, { heroId }) => {
  if (!heroId) {
    throw new Error("Missing heroId");
  }

  const movies = await db
    .prepare(GET_MOVIES_BY_HERO_ID_QUERY)
    .bind(heroId)
    .all();

  if (!movies.success) {
    return APIResponse(false, null, "Failed to fetch movies.");
  }

  return APIResponse(true, movies.results, "Movies fetched successfully.");
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
    return APIResponse(
      false,
      null,
      "Missing required fields: title, heroId, or user."
    );
  }

  const existingMovie = await db
    .prepare(CHECK_MOVIE_EXISTS_QUERY)
    .bind(title, heroId)
    .first();

  if (existingMovie) {
    console.error("Movie already exists:", existingMovie);
    return APIResponse(false, null, "Movie already exists.");
  }

  const resp = await db
    .prepare(INSERT_MOVIE_QUERY)
    .bind(title, heroId, user)
    .run();

  if (!resp.success) {
    console.error("Failed to create movie:", resp.error);
    return APIResponse(false, null, "Failed to create movie.");
  }

  return APIResponse(true, null, "Movie created successfully.");
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
export const updateMovie = async (db, { id, title, need_review, user }) => {
  // id and user are required, title or need_review should be provided
  if (!id || !user) {
    return APIResponse(false, null, "Missing required fields: id or user.");
  }

  if (title === undefined && need_review === undefined) {
    return APIResponse(
      false,
      null,
      "Missing required fields: title or need_review."
    );
  }

  // If need_review is provided, update it
  if (need_review !== undefined) {
    const resp = await db
      .prepare(UPDATE_MOVIE_NEED_REVIEW_QUERY)
      .bind(need_review, user, id)
      .run();

    if (!resp.success) {
      console.error("Failed to update movie need_review:", resp.error);
      return APIResponse(false, null, "Failed to update movie need_review.");
    }
  }

  // If title is provided, update it
  if (title !== undefined) {
    const resp = await db
      .prepare(UPDATE_MOVIE_TITLE_QUERY)
      .bind(title, user, id)
      .run();

    if (!resp.success) {
      console.error("Failed to update movie title:", resp.error);
      return APIResponse(false, null, "Failed to update movie title.");
    }
  }

  return APIResponse(true, null, "Movie updated successfully.");
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
    return APIResponse(false, null, "Missing required field: id.");
  }

  const resp = await db.prepare(DELETE_MOVIE_QUERY).bind(id).run();

  if (!resp.success) {
    console.error("Failed to delete movie:", resp.error);
    return APIResponse(false, null, "Failed to delete movie.");
  }

  return APIResponse(true, null, "Movie deleted successfully.");
};
