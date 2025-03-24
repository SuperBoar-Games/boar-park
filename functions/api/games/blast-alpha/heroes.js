export async function onRequest(context) {
    const ps = context.env.BoarDB.prepare("SELECT * from heroes");
    const { results } = await ps.all();

    return Response.json(results);
}
