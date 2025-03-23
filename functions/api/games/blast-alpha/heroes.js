export async function onRequest(context) {
    const ps = context.env.BoarDB.prepare("SELECT * from heroes");
    const data = await ps.first();

    return Response.json(data);
}
