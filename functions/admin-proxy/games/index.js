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
    const AUD = context.env.ADMIN_POLICY_AUD;
    const TEAM_DOMAIN = `https://${context.env.TEAM_DOMAIN}`;
    const CERTS_URL = `${TEAM_DOMAIN}/cdn-cgi/access/certs`;

    console.log(`jwtAssertion: ${jwtAssertion}`);
    console.log(`AUD: ${AUD}`); // Log the Audience Tag
    console.log(`CERTS_URL: ${CERTS_URL}`); // Log the Certs URL

    const payload1 = jose.decodeJwt(jwtAssertion);
    console.log("Actual iss in token:", payload1.iss);
    console.log("Actual aud in token:", payload1.aud);

    const JWKS = jose.createRemoteJWKSet(new URL(CERTS_URL));
    console.log(`JWKS: ${JWKS}`); // Log JWKS

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
    console.log(`JWT Headers: ${JSON.stringify(protectedHeader)}`);

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
