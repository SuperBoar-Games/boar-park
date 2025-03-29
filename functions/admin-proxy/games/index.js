import * as jose from "jose";
import { fetchWithAccess } from "../../utils/fetchWithAccess";

export async function onRequest(context) {
  const baseUrl = new URL(context.request.url).origin;
  const apiURL = `${baseUrl}/api/games/`;

  const jwtAssertion = context.request.headers.get("cf-access-jwt-assertion");

  if (!jwtAssertion) {
    console.log("No JWT Assertion found");
    return new Response("Unauthorized - No JWT", { status: 401 });
  }

  try {
    const ADMIN_AUD = context.env.ADMIN_POLICY_AUD;
    const SUBDOMAIN_ADMIN_AUD = context.env.SUBDOMAIN_ADMIN_POLICY_AUD;
    const DOMAINS = context.env.DOMAINS.split(",");

    const TEAM_DOMAIN = `https://${context.env.TEAM_DOMAIN}`;
    const CERTS_URL = `${TEAM_DOMAIN}/cdn-cgi/access/certs`;

    const JWKS = jose.createRemoteJWKSet(new URL(CERTS_URL));

    const url = new URL(context.request.url);
    const hostname = url.hostname;

    let audience = ADMIN_AUD; // Default to ADMIN_AUD
    let isSubdomain = false;

    for (const mainDomain of DOMAINS) {
      if (hostname.endsWith(mainDomain) && hostname !== mainDomain) {
        isSubdomain = true;
        break;
      }
    }

    const AUD = isSubdomain ? SUBDOMAIN_ADMIN_AUD : ADMIN_AUD;

    // Verify the JWT using the JWKS
    const { payload, protectedHeader } = await jose.jwtVerify(
      jwtAssertion,
      JWKS,
      {
        issuer: TEAM_DOMAIN,
        audience: AUD,
      },
    );

    console.log("JWT verification successful!");
    console.log(`JWT Payload: ${JSON.stringify(payload)}`); // Log full payload

    // If authorized, proceed to fetch the actual page
    const res = await fetchWithAccess(apiURL, context);
    const result = await res.json();
    return Response.json(result);
  } catch (error) {
    console.error("JWT verification failed:", error);
    console.error("Error Details:", error); // Log the entire error object
    return new Response("Unauthorized - Invalid session", { status: 401 });
  }
}
