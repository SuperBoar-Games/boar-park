import { fetchWithAccess } from "../../../utils/fetchWithAccess";

export async function onRequest(context) {
    const baseUrl = new URL(context.request.url).origin;
    const apiURL = `${baseUrl}/api/games/blast-alpha/`;

    const res = await fetchWithAccess(apiURL, context);

    const data = await res.json();
    return Response.json(data);
}
