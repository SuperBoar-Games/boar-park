import * as jose from "jose";

export async function onRequest(context) {
  const isDev = context.env.NODE_ENV?.trim() === "development";

  const reqUrl = new URL(context.request.url);
  const originUrl = reqUrl.origin;
  const endpoint = context.params.apiPath;
  const query = reqUrl.search;
  const apiURL = `${originUrl}/api/${endpoint}/${query}`;

  let userEmail;

  if (isDev) {
    // Skip auth in dev
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
      console.error("❗ JWT verification failed: ", error);
      if (isDev) console.error("🔍 Full error details:", error);
      return new Response("Unauthorized - Invalid session", { status: 401 });
    }
  }

  try {
    const customHeaders = {
      "x-bp-user": userEmail,
    };

    let requestBody;
    if (
      context.request.method === "POST" ||
      context.request.method === "PUT" ||
      context.request.method === "PATCH" ||
      context.request.method === "DELETE"
    ) {
      try {
        requestBody = await context.request.json();
      } catch (e) {
        return new Response("Bad Request - Invalid JSON", { status: 400 });
      }
    }

    const res = await fetchWithAccess(apiURL, context, {
      method: context.request.method,
      headers: {
        ...context.request.headers,
        ...customHeaders,
      },
      body: requestBody ? JSON.stringify(requestBody) : null,
    });
    
    let result;
    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      result = await res.json();
    } else {
      const text = await res.text();
      console.error("❗ Unexpected content type:", contentType);
      console.error("Response text:", text);
      throw new Error(`Unexpected content type: ${contentType}\nResponse text: ${text}`);
    }

    return new Response(JSON.stringify(result), { status: res.status });
  } catch (apiError) {
    console.error("❗ API request failed:", apiError);
    return new Response(`${apiError.message}\n${apiError.stack}`, { status: 500 });
  }
}

async function fetchWithAccess(url, context, options = {}) {
  const headers = {
    ...options.headers,
    "CF-Access-Client-Id": context.env.API_CLIENT_ID,
    "CF-Access-Client-Secret": context.env.API_CLIENT_SECRET,
    "Content-Type": "application/json",
  };

  const finalOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, finalOptions);
    return response;
  } catch (error) {
    console.error("❗ fetchWithAccess → Fetch failed:", error);
    throw error;
  }
}
