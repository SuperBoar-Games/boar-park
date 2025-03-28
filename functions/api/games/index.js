import { getAllGames } from '../../../db/schema/queries/gamesQueries';

async function getGameHandler(gameSlug) {
  switch (gameSlug) {
    case 'blast-alpha':
      try {
        const module = await import('./blast-alpha/gameHandler');
        return module.gameHandler;
      } catch (error) {
        console.error("Error importing game handler:", error);
        return null;
      }
    default:
      return null;
  }
}

function errorResponse(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status: status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context) {
  const reqUrl = new URL(context.request.url);
  const queryParams = new URLSearchParams(reqUrl.search);

  // get game slug
  const gameSlug = queryParams.get('gameSlug');

  if (!gameSlug) {
    const ps = context.env.BoarDB.prepare(getAllGames);
    const { results } = await ps.all();

    return Response.json(results);
  }

  console.log(`gameSllug: ${gameSlug}`);

  const gameHandler = await getGameHandler(gameSlug);
  if (!gameHandler) {
    return errorResponse('Game not found', 404);
  }

  // get sub-query
  queryParams.delete('gameSlug');

  try {
    const results = gameHandler(queryParams);
    return Response.json(results);
  } catch (error) {
    console.error("Error executing game query:", error);
    return errorResponse('Error executing game query', 500);
  }
}
