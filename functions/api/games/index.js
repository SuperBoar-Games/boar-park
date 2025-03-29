export async function onRequest(context) {
  // log user email
  const userEmail = context.request.headers.get("X-BP-User");
  console.log(`userEmail: ${userEmail}`);

  const ps = context.env.BoarDB.prepare("SELECT * from games");
  const { results } = await ps.all();

  return Response.json(results);
}
