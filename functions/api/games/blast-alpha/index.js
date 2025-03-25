export async function onRequest(context) {
  const ps = context.env.BoarDB.prepare(`
    SELECT
      h.*,
      COUNT(m.id) AS total_movies,
      COUNT(CASE WHEN m.status = 'PENDING' THEN 1 END) AS pending_movies
    FROM heroes h
    LEFT JOIN movies m ON m.hero_id = h.id
    GROUP BY h.id
    ORDER BY h.category ASC, h.name ASC;
  `);

  const { results } = await ps.all();

  return Response.json(results);
}
