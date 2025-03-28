import { fetchWithAccess } from "../../utils/fetchWithAccess";

export async function onRequest(context) {
  const baseUrl = new URL(context.request.url).origin;
  const apiURL = `${baseUrl}/api/games/`;

  // Log Cloudflare Access headers
  const headers = context.request.headers;
  console.log("Cloudflare Access Headers:", {
    'CF-App-Session': headers.get('CF-App-Session'),
    'CF-Authorization': headers.get('CF-Authorization'),
    'CF-Clearance': headers.get('CF-Clearance'),
  });

  const res = await fetchWithAccess(apiURL, context);

  const result = await res.json();
  return Response.json(result);
}
