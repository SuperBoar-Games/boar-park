export async function onRequest(context) {
  const { card_id } = context.params;

  const ps = context.env.BoarDB.prepare(`
    SELECT c.id, c.name, c.type, c.call_sign, c.ability_text, c.image_url, c.is_add_on,
           m.title AS movie_title, h.name AS hero_name
    FROM cards c
    LEFT JOIN movies m ON c.movie_id = m.id
    JOIN heroes h ON c.hero_id = h.id
    WHERE c.id = ?
  `);

  const card = await ps.bind(card_id).first();

  if (!card) {
    return new Response("Card not found", { status: 404 });
  }

  return Response.json(card);
}
