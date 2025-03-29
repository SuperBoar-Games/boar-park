export async function fetchWithAccess(url, context, options = {}) {
  const isDev = context.env.NODE_ENV === "development";

  const headers = {
    ...options.headers,
    "CF-Access-Client-Id": context.env.API_CLIENT_ID,
    "CF-Access-Client-Secret": context.env.API_CLIENT_SECRET,
  };

  const finalOptions = {
    ...options,
    headers,
  };

  if (isDev) {
    console.log("🌐 fetchWithAccess → URL:", url);
    console.log("🧾 fetchWithAccess → Options:", {
      method: finalOptions.method || "GET",
      headers: {
        ...headers,
        "CF-Access-Client-Secret": "***REDACTED***", // hide secret in logs
      },
    });
  }

  try {
    const response = await fetch(url, finalOptions);

    if (isDev) {
      console.log("📥 fetchWithAccess → Response status:", response.status);
    }

    return response;
  } catch (error) {
    console.error("❗ fetchWithAccess → Fetch failed:", error);
    throw error; // rethrow so caller can handle
  }
}
