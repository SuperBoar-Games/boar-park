import { getAllGames } from "../../../db/queries/gamesQueries";

const gameHandlers = {
  "blast-alpha": () =>
    import("./blast-alpha/gameHandler").then((module) => module.gameHandler),
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

function errorResponse(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status: status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequest(context) {
  const reqUrl = new URL(context.request.url);
  const queryParams = new URLSearchParams(reqUrl.search);

  // get game slug
  const gameSlug = queryParams.get("gameSlug");

  if (!gameSlug) {
    try {
      const ps = context.env.BoarDB.prepare(getAllGames);
      const { results } = await ps.all();
      return Response.json(results);
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
    const response = await gameHandler(context);
    // const results = await response.json();
    // console.log("Game handler results:", JSON.stringify(results, null, 2));
    return response;
  } catch (error) {
    console.error("Error executing game query:", error);
    return errorResponse("Error executing game query", 500);
  }
}
