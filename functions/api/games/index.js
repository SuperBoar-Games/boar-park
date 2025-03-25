export async function onRequest(context) {
    const ps = context.env.BoarDB.prepare("SELECT * from games");
    const { results } = await ps.all();

    return Response.json(results);
}
