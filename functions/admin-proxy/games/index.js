import * as jose from "jose";
import { fetchWithAccess } from "../../utils/fetchWithAccess";

export async function onRequest(context) {
  const isDev = context.env.NODE_ENV === "development";

  const baseUrl = new URL(context.request.url).origin;
  const apiURL = `${baseUrl}/api/games/`;

  const jwtAssertion = context.request.headers.get("cf-access-jwt-assertion");

  if (!jwtAssertion) {
    if (isDev) console.log("❌ No JWT Assertion found in request headers");
    return new Response("Unauthorized - No JWT", { status: 401 });
  }

  let userEmail;

  try {
    const ADMIN_AUD = context.env.ADMIN_POLICY_AUD;
    const SUBDOMAIN_ADMIN_AUD = context.env.SUBDOMAIN_ADMIN_POLICY_AUD;
    const DOMAINS = context.env.DOMAINS.split(",");
    const TEAM_DOMAIN = `https://${context.env.TEAM_DOMAIN}`;
    const CERTS_URL = `${TEAM_DOMAIN}/cdn-cgi/access/certs`;

    const JWKS = jose.createRemoteJWKSet(new URL(CERTS_URL));
    const url = new URL(context.request.url);
    const hostname = url.hostname;

    if (isDev) {
      console.log("🔍 Hostname:", hostname);
      console.log("🔐 Using JWKS URL:", CERTS_URL);
      console.log("📍 DOMAINS:", DOMAINS);
    }

    let isSubdomain = false;
    for (const mainDomain of DOMAINS) {
      if (hostname.endsWith(mainDomain) && hostname !== mainDomain) {
        isSubdomain = true;
        break;
      }
    }

    const AUD = isSubdomain ? SUBDOMAIN_ADMIN_AUD : ADMIN_AUD;
    if (isDev) console.log("🧭 Determined Audience:", AUD);

    const { payload, protectedHeader } = await jose.jwtVerify(
      jwtAssertion,
      JWKS,
      {
        issuer: TEAM_DOMAIN,
        audience: AUD,
      },
    );

    if (isDev) {
      console.log("✅ JWT Payload:", payload);
      console.log("🛡️ JWT Header:", protectedHeader);
    }

    userEmail = payload.email;

    if (!userEmail) {
      if (isDev) console.log("❌ No email found in JWT payload");
      return new Response("Unauthorized - No user identifier", { status: 401 });
    }
  } catch (error) {
    console.error("❗ JWT verification failed");
    if (isDev) console.error("🔍 Full error details:", error);
    return new Response("Unauthorized - Invalid session", { status: 401 });
  }

  // Now do the API call
  try {
    const customHeaders = {
      "X-BP-User": userEmail,
    };

    if (isDev) {
      console.log("📫 Forwarding request to:", apiURL);
      console.log("🔧 Custom headers:", customHeaders);
    }

    const res = await fetchWithAccess(apiURL, context, {
      headers: customHeaders,
    });

    const result = await res.json();

    if (isDev) console.log("📦 API Response:", result);

    return Response.json(result);
  } catch (apiError) {
    console.error("❗ API request failed:", apiError);
    return new Response("Internal Server Error - Could not fetch data", {
      status: 500,
    });
  }
}
