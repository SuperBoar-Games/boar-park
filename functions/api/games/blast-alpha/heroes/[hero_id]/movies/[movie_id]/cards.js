export async function onRequest(context) {
  const { hero_id, movie_id } = context.params;

  const ps = context.env.BoarDB.prepare(`
    SELECT c.id, c.name, c.type, c.call_sign, c.ability_text, c.image_url
    FROM cards c
    WHERE c.hero_id = ? AND c.movie_id = ? AND c.is_add_on = 0
    ORDER BY c.id ASC, c.type ASC
  `);

  const { results } = await ps.bind(hero_id, movie_id).all();
  return Response.json(results);
}
