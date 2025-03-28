import { fetchWithAccess } from "../../utils/fetchWithAccess";

export async function onRequest(context) {
  const baseUrl = new URL(context.request.url).origin;
  const apiURL = `${baseUrl}/api/games/`;

  // Log ALL headers
  const headers = {};
  for (const [key, value] of context.request.headers.entries()) {
    headers[key] = value;
  }
  console.log("All Request Headers:", headers);

  const res = await fetchWithAccess(apiURL, context);

  const result = await res.json();
  return Response.json(result);
}
