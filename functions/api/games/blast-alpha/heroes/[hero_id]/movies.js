export async function onRequest(context) {
    const heroId = context.params.hero_id;

    const ps = context.env.BoarDB.prepare(
        `SELECT id, title FROM movies
         WHERE hero_id = ?
        `);

    const { results } = await ps.bind(heroId).all();
    return Response.json(results);
}
