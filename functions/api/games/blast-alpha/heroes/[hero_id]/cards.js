export async function onRequest(context) {
  const heroId = context.params.hero_id;

  const ps = context.env.BoarDB.prepare(
    `SELECT c.id, c.name, c.type, c.call_sign, c.ability_text, c.image_url, c.is_add_on, m.title AS movie_title
    FROM cards c
    LEFT JOIN movies m ON c.movie_id = m.id
    WHERE c.hero_id = ?
    ORDER BY c.id ASC, c.type ASC
  `);

  const { results } = await ps.bind(heroId).all();
  return Response.json(results);
}
