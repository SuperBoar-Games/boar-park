import {
  GET_ALL_TAGS,
  INSERT_TAG,
  UPDATE_TAG,
  DELETE_TAG,
  GET_TAGS_BY_CARD,
  DELETE_CARD_TAGS,
  INSERT_CARD_TAGS_BY_NAME,
  INSERT_CARD_TAGS_BY_ID,
  GET_TAG_COUNTS_BY_HERO
} from "../../../../db/queries/blast-alpha/tags.queries.js";
import { APIResponse } from "../../utils.js";


export const getAllTags = async (db) => {
  const resp = await db.prepare(GET_ALL_TAGS).all();

  if (!resp.success) {
    return APIResponse(false, null, "Failed to fetch tags.");
  }

  return APIResponse(true, resp.results, "Tags fetched.");
};

export const createTag = async (db, { name }) => {
  if (!name) {
    return APIResponse(false, null, "Tag name required.");
  }

  const tag = await db
    .prepare(INSERT_TAG)
    .bind(name.trim())
    .first();

  if (!tag) {
    return APIResponse(false, null, "Failed to create tag.");
  }

  return APIResponse(true, tag, "Tag created.");
};

export const updateTag = async (db, { tagId, name }) => {
  if (!tagId || !name) {
    return APIResponse(false, null, "Tag ID and name required.");
  }

  const tag = await db
    .prepare(UPDATE_TAG)
    .bind(name.trim(), tagId)
    .first();

  if (!tag) {
    return APIResponse(false, null, "Tag not found.");
  }

  return APIResponse(true, tag, "Tag updated.");
};

export const deleteTag = async (db, { tagId }) => {
  if (!tagId) {
    return APIResponse(false, null, "Tag ID required.");
  }

  const deleted = await db
    .prepare(DELETE_TAG)
    .bind(tagId)
    .first();

  if (!deleted) {
    return APIResponse(false, null, "Tag not found.");
  }

  return APIResponse(true, deleted, "Tag deleted.");
};

export const getTagsByCardId = async (db, { cardId }) => {
  if (!cardId) {
    return APIResponse(false, null, "Card ID required.");
  }

  const resp = await db
    .prepare(GET_TAGS_BY_CARD)
    .bind(cardId)
    .all();

  if (!resp.success) {
    return APIResponse(false, null, "Failed to fetch tags.");
  }

  return APIResponse(true, resp.results, "Tags fetched.");
};

export const setTagsForCard = async (db, { cardId, tagIds }) => {
  if (!cardId || !Array.isArray(tagIds)) {
    return APIResponse(false, null, "Invalid cardId or tagIds.");
  }

  // Remove existing tags
  await db.prepare(DELETE_CARD_TAGS).bind(cardId).run();

  if (tagIds.length === 0) {
    return APIResponse(true, [], "Tags cleared.");
  }

  // Insert new tags
  const stmt = db.prepare(INSERT_CARD_TAGS_BY_ID);

  for (const tagId of tagIds) {
    await stmt.bind(cardId, tagId).run();
  }

  // Return updated tags
  const updated = await db
    .prepare(GET_TAGS_BY_CARD)
    .bind(cardId)
    .all();

  if (!updated.success) {
    return APIResponse(false, null, "Failed to fetch updated tags.");
  }

  return APIResponse(true, updated.results, "Tags updated.");
};

export const getTagCountsByHeroId = async (db, { heroId }) => {
  if (!heroId) {
    return APIResponse(false, null, "Hero ID required.");
  }

  const resp = await db
    .prepare(GET_TAG_COUNTS_BY_HERO)
    .bind(heroId)
    .all();

  if (!resp.success) {
    return APIResponse(false, null, "Failed to fetch tag counts.");
  }

  return APIResponse(true, resp.results, "Tag counts fetched.");
};

