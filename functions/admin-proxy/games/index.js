import { fetchWithAccess } from "../../utils/fetchWithAccess";

export async function onRequest(context) {
    const baseUrl = new URL(context.request.url).origin;
    const apiURL = `${baseUrl}/api/games/`;

    const res = await fetchWithAccess(apiURL, context);
    
    const result = await res.json();
    return Response.json(result);
}
