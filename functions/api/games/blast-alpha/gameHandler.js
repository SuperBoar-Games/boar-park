import { getHeroesWithMovieCount } from "../../../../db/schema/queries/blast-alpha/heroesQueries";
import { getMoviesByHeroId } from "../../../../db/schema/queries/blast-alpha/moviesQueries";
import { getCardsByHeroAndMovieId } from "../../../../db/schema/queries/blast-alpha/cardsQueries";

const queryMap = {
  default: {
    query: getHeroesWithMovieCount,
    params: () => [],
  },
  heroId: {
    query: getMoviesByHeroId,
    params: (parsedParams) => [parsedParams.get("heroId")],
  },
  movieIdAndHeroId: {
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
};

export const gameHandler = async (queryParams, db) => {
  const parsedParams = new URLSearchParams(queryParams);

  try {
    let queryKey = "default";

    if (parsedParams.has("heroId") && !parsedParams.has("movieId")) {
      queryKey = "heroId";
    } else if (parsedParams.has("movieId") && parsedParams.has("heroId")) {
      queryKey = "movieIdAndHeroId";
    }

    const { query, params: paramsFn } = queryMap[queryKey];
    const params = paramsFn(parsedParams);

    // Execute the query
    const ps = db.prepare(query);
    const { results } = await ps.bind(...params).all();
    return results;
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
