import {
  getHeroes,
  createHero,
  updateHero,
  deleteHero,
} from "../../../../db/queries/blast-alpha/heroesQueries.js";
import {
  getMoviesByHeroId,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../../../../db/queries/blast-alpha/moviesQueries";
import {
  getCardsByHeroAndMovieId,
  getAllCardsByHeroId,
  createCard,
  updateCard,
  deleteCard,
} from "./cards.api.js";
import {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  getTagsByCardId,
  setTagsForCard,
  getTagCountsByHeroId,
} from "./tags.api.js";

import { errorResponse, successResponse } from "../../utils.js";

const queryMap = {
  GET: {
    hero: getHeroes,
    movie: getMoviesByHeroId,
    card: getCardsByHeroAndMovieId,
    cardsByHero: getAllCardsByHeroId,
    tags: getAllTags,
    tagsByCard: getTagsByCardId,
    tagsCountByHero: getTagCountsByHeroId,
  },
  POST: {
    hero: createHero,
    movie: createMovie,
    card: createCard,
    tags: createTag,
  },
  PUT: {
    hero: updateHero,
    movie: updateMovie,
    card: updateCard,
    tags: updateTag,
    setTagsForCard: setTagsForCard,
  },
  DELETE: {
    hero: deleteHero,
    movie: deleteMovie,
    card: deleteCard,
    tags: deleteTag,
  },
};

export const gameHandler = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const queryKey = url.searchParams.get("queryKey");
  if (!queryKey) {
    return errorResponse("Missing queryKey", 400);
  }

  const handler = queryMap[method]?.[queryKey];
  if (!handler) {
    return errorResponse("Invalid queryKey or method", 400);
  }

  try {
    let payload = {};

    if (method === "GET") {
      url.searchParams.forEach((value, key) => {
        payload[key] = value;
      });
    } else {
      payload = await request.json();
      payload.user = request.headers.get("x-bp-user");
      payload.gameSlug = url.searchParams.get("gameSlug");
    }

    const resp = await handler(env.BoarDB, payload);

    if (!resp?.success) {
      return errorResponse(resp?.message || "Operation failed", 400);
    }

    return successResponse(resp);
  } catch (err) {
    console.error("gameHandler error:", err);
    return errorResponse("Internal server error", 500);
  }
};

