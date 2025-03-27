export async function onRequest(context) {
  const { hero_id, movie_id } = context.params;

  const ps = context.env.BoarDB.prepare(`
    SELECT *
    FROM cards c
    WHERE c.hero_id = ? AND c.movie_id = ?
    ORDER BY c.id ASC, c.type ASC
  `);

  const { results } = await ps.bind(hero_id, movie_id).all();
  return Response.json(results);
}
