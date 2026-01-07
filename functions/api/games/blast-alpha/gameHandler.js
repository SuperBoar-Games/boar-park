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
} from "../../../../db/queries/blast-alpha/cardsQueries";

import { errorResponse, successResponse } from "../../utils.js";

const queryMap = {
  GET: {
    hero: getHeroes,
    movie: getMoviesByHeroId,
    card: getCardsByHeroAndMovieId,
    cardsByHero: getAllCardsByHeroId,
  },
  POST: {
    hero: createHero,
    movie: createMovie,
    card: createCard,
  },
  PUT: {
    hero: updateHero,
    movie: updateMovie,
    card: updateCard,
  },
  DELETE: {
    hero: deleteHero,
    movie: deleteMovie,
    card: deleteCard,
  },
};

export const gameHandler = async (context) => {
  const reqUrl = new URL(context.request.url);
  const queryParams = new URLSearchParams(reqUrl.search);
  const method = context.request.method;

  try {
    if (method === "GET") {
      let queryKey = "hero";

      if (queryParams.has("heroId") && queryParams.get("getAllCards") === "true") {
        queryKey = "cardsByHero";
      } else if (queryParams.has("heroId") && !queryParams.has("movieId")) {
        queryKey = "movie";
      } else if (queryParams.has("movieId") && queryParams.has("heroId")) {
        queryKey = "card";
      }

      const query = queryMap.GET[queryKey];
      if (!query) {
        return errorResponse("Invalid query key", 400);
      }

      const queryParamsObj = {};
      if (queryKey === "movie") {
        queryParamsObj.heroId = queryParams.get("heroId");
      } else if (queryKey === "card") {
        queryParamsObj.heroId = queryParams.get("heroId");
        queryParamsObj.movieId = queryParams.get("movieId");
      } else if (queryKey === "cardsByHero") {
        queryParamsObj.heroId = queryParams.get("heroId");
      }
      const resp = await query(context.env.BoarDB, queryParamsObj);
      if (!resp.success) {
        return errorResponse("No results found", 404);
      }

      return successResponse(resp);
    }
    if (["POST", "PUT", "DELETE"].includes(method)) {
      // log request and body
      const body = await context.request.json();

      // extend body with user
      body.gameSlug = queryParams.get("gameSlug");
      body.user = context.request.headers.get("x-bp-user");

      // process the request
      const queryKey = queryParams.get("queryKey");
      const query = queryMap[method][queryKey];

      if (!query) {
        console.error("Invalid query key:", queryKey);
        return errorResponse("Invalid query key", 400);
      }

      try {
        const resp = await query(context.env.BoarDB, body);
        if (!resp.success) {
          console.error("Query failed:", resp.message);
          return errorResponse(resp.message, 404);
        }
        return successResponse(resp);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return errorResponse("Database error", 500);
      }
    }
  } catch (error) {
    console.error("Error in gameHandler:", error);
    return errorResponse("Internal server error", 500);
  }
};
