import { getAllGames } from "./games.api.js";
import { errorResponse, successResponse } from "../utils.js";

const gameHandlers = {
  "blast-alpha": () =>
    import("./blast-alpha/blastAlpha.handler.js").then((module) => module.gameHandler),
};

async function getGameHandler(gameSlug) {
  const handlerLoader = gameHandlers[gameSlug];
  if (handlerLoader) {
    try {
      return await handlerLoader();
    } catch (error) {
      console.error("Error importing game handler:", error);
      return null;
    }
  }
  return null;
}

export async function onRequest(context) {
  const reqUrl = new URL(context.request.url);
  const queryParams = new URLSearchParams(reqUrl.search);

  // get game slug
  const gameSlug = queryParams.get("gameSlug");

  if (!gameSlug) {
    try {
      const resp = await getAllGames(context.env.BoarDB);
      if (!resp.success) {
        return errorResponse("No games found", 404);
      }

      return successResponse(resp);
    } catch (error) {
      console.error("Error fetching all games:", error);
      return errorResponse("Error fetching games", 500); // More specific error
    }
  }

  const gameHandler = await getGameHandler(gameSlug);
  if (!gameHandler) {
    return errorResponse("Game not found", 404);
  }

  try {
    return await gameHandler(context);
  } catch (error) {
    console.error("Error executing game query:", error);
    return errorResponse("Error executing game query", 500);
  }
}
