import {
  INSERT_CARD,
  UPDATE_CARD,
  DELETE_CARD,
  GET_CARDS_BY_HERO_AND_MOVIE,
  GET_ALL_CARDS_BY_HERO,
  GET_CARD_BY_ID
} from "../../../../db/queries/blast-alpha/cards.queries.js";
import { APIResponse } from "../../utils.js";


export const createCard = async (db, payload) => {
  const inserted = await db
    .prepare(INSERT_CARD)
    .bind(
      payload.name,
      payload.type,
      payload.heroId,
      payload.movieId,
      payload.call_sign || null,
      payload.ability_text,
      payload.ability_text2 || null,
      payload.user
    )
    .first();

  if (!inserted) {
    return APIResponse(false, null, "Failed to create card.");
  }

  const cardRaw = await db
    .prepare(GET_CARD_BY_ID)
    .bind(inserted.id)
    .first();

  if (!cardRaw) {
    return APIResponse(false, null, "Card not found after create.");
  }

  const { tag_ids, tag_names, ...card } = cardRaw;
  card.tags = normalizeTags(cardRaw);

  return APIResponse(true, card, "Card created successfully.");
};

export const updateCard = async (db, payload) => {
  const updated = await db
    .prepare(UPDATE_CARD)
    .bind(
      payload.name ?? null,
      payload.type ?? null,
      payload.call_sign ?? null,
      payload.ability_text ?? null,
      payload.ability_text2 ?? null,
      payload.need_review ?? null,
      payload.user,
      payload.cardId,
    )
    .first();

  if (!updated) {
    return APIResponse(false, null, "Card not found.");
  }

  const cardRaw = await db
    .prepare(GET_CARD_BY_ID)
    .bind(payload.cardId)
    .first();

  if (!cardRaw) {
    return APIResponse(false, null, "Card not found after update.");
  }

  const { tag_ids, tag_names, ...card } = cardRaw;
  card.tags = normalizeTags(cardRaw);

  return APIResponse(true, card, "Card updated successfully.");
};

export const deleteCard = async (db, { cardId }) => {
  const deleted = await db
    .prepare(DELETE_CARD)
    .bind(cardId)
    .first();

  if (!deleted) {
    return APIResponse(false, null, "Card not found.");
  }

  return APIResponse(true, deleted, "Card deleted successfully.");
};

function normalizeTags(row) {
  if (!row.tag_ids || !row.tag_names) return [];

  const ids = row.tag_ids.split(",");
  const names = row.tag_names.split(",");

  return ids.map((id, i) => ({
    id: Number(id),
    name: names[i],
  }));
}

export const getCardsByHeroAndMovieId = async (db, { heroId, movieId }) => {
  if (!heroId || !movieId) {
    return APIResponse(false, null, "Missing heroId or movieId.");
  }

  const resp = await db
    .prepare(GET_CARDS_BY_HERO_AND_MOVIE)
    .bind(heroId, movieId)
    .all();

  if (!resp.success) {
    return APIResponse(false, null, "Failed to fetch cards.");
  }

  const cards = resp.results.map((row) => {
    const { tag_ids, tag_names, ...card } = row;

    return {
      ...card,
      tags: normalizeTags(row),
    };
  });

  return APIResponse(true, cards, "Cards fetched.");
};

export const getAllCardsByHeroId = async (db, { heroId }) => {
  if (!heroId) {
    return APIResponse(false, null, "Missing heroId.");
  }

  const resp = await db
    .prepare(GET_ALL_CARDS_BY_HERO)
    .bind(heroId)
    .all();

  if (!resp.success) {
    return APIResponse(false, null, "Failed to fetch cards.");
  }

  const cards = resp.results.map((row) => {
    const { tag_ids, tag_names, ...card } = row;

    return {
      ...card,
      tags: normalizeTags(row),
    };
  });

  return APIResponse(true, cards, "Cards fetched.");
};

