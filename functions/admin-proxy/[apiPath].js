import * as jose from "jose";
import { fetchWithAccess } from "../utils/fetchWithAccess";

export async function onRequest(context) {
  const isDev = context.env.NODE_ENV?.trim() === "development";

  const reqUrl = new URL(context.request.url);
  const originUrl = reqUrl.origin;
  const endpoint = context.params.apiPath;
  const query = reqUrl.search;
  const apiURL = `${originUrl}/api/${endpoint}/${query}`;

  let userEmail;

  if (isDev) {
    // 👇 Skip auth in dev
    userEmail = "dev@example.com";
  } else {
    const jwtAssertion = context.request.headers.get("cf-access-jwt-assertion");

    if (!jwtAssertion) {
      return new Response("Unauthorized, No JWT", { status: 401 });
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

      let isSubdomain = false;
      for (const mainDomain of DOMAINS) {
        if (hostname.endsWith(mainDomain) && hostname !== mainDomain) {
          isSubdomain = true;
          break;
        }
      }

      const AUD = isSubdomain ? SUBDOMAIN_ADMIN_AUD : ADMIN_AUD;

      const { payload } = await jose.jwtVerify(jwtAssertion, JWKS, {
        issuer: TEAM_DOMAIN,
        audience: AUD,
      });

      userEmail = payload.email;

      if (!userEmail) {
        return new Response("Unauthorized - No user identifier", {
          status: 401,
        });
      }
    } catch (error) {
      console.error("❗ JWT verification failed");
      if (isDev) console.error("🔍 Full error details:", error);
      return new Response("Unauthorized - Invalid session", { status: 401 });
    }
  }

  try {
    const customHeaders = {
      "X-BP-User": userEmail,
    };

    const res = await fetchWithAccess(apiURL, context, {
      headers: customHeaders,
    });

    const result = await res.json();

    return Response.json(result);
  } catch (apiError) {
    console.error("❗ API request failed:", apiError);
    return new Response("Internal Server Error - Could not fetch data", {
      status: 500,
    });
  }
}
