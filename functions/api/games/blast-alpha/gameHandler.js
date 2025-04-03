import {
  getHeroesWithMovieCount,
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
  createCard,
  updateCard,
  deleteCard,
} from "../../../../db/queries/blast-alpha/cardsQueries";

const queryMap = {
  GET: {
    hero: {
      query: getHeroesWithMovieCount,
      params: () => [],
    },
    movie: {
      query: getMoviesByHeroId,
      params: (parsedParams) => [parsedParams.get("heroId")],
    },
    card: {
      query: getCardsByHeroAndMovieId,
      params: (parsedParams) => {
        const heroId = parsedParams.get("heroId");
        const movieId = parsedParams.get("movieId");

        if (!heroId || !movieId) {
          throw new Error("Missing heroId or movieId");
        }

        return [heroId, movieId];
      },
    },
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

      if (queryParams.has("heroId") && !queryParams.has("movieId")) {
        queryKey = "movie";
      } else if (queryParams.has("movieId") && queryParams.has("heroId")) {
        queryKey = "card";
      }

      const { query, params: paramsFn } = queryMap.GET[queryKey];
      const ps = context.env.BoarDB.prepare(query);
      const { results } = await ps.bind(...paramsFn(queryParams)).all();

      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (["POST", "PUT", "DELETE"].includes(method)) {
      // log request and body
      const body = await context.request.json();
      console.log("Request method:", method);
      console.log("Request body:", body);

      return new Response("ok", {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in gameHandler:", error);

    let status = 500;
    let message = "Internal Server Error";

    if (error.message === "Missing heroId or movieId") {
      status = 400;
      message = "Missing heroId or movieId";
    }

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
