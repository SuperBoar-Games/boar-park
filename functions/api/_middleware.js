import * as jose from "jose";

export async function onRequest(context) {
  const isDev = context.env.NODE_ENV?.trim() === "development";

  let userEmail;

  if (isDev) {
    // skip auth in dev
    userEmail = "dev@superboar.com";
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
      console.error("❗ JWT verification failed", error);
      return new Response("Unauthorized - Invalid JWT", { status: 401 });
    }
  }

  try {
    const customHeaders = new Headers(context.request.headers);
    customHeaders.set("x-bp-User", userEmail);

    const newRequest = new Request(context.request.url, {
      method: context.request.method,
      headers: customHeaders,
      body: context.request.body,
      redirect: context.request.redirect,
    });

    return await context.next(newRequest);
  } catch (err) {
    return new Response(`${err.message}\n${err.stack}`, { status: 500 });
  }
}
