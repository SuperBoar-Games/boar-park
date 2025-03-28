import { fetchWithAccess } from "../utils/fetchWithAccess";

export async function onRequest(context) {
  const reqUrl = new URL(context.request.url);
  const originUrl = reqUrl.origin;
  const endpoint = context.params.apiPath;
  const query = reqUrl.search;

  const apiURL = `${originUrl}/api/${endpoint}/${query}`;

  const res = await fetchWithAccess(apiURL, context);

  const data = await res.json();
  return Response.json(data);
}
