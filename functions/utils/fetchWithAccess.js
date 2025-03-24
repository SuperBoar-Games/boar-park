export async function fetchWithAccess(url, context, options = {}) {
    const headers = {
        ...options.headers,
        "CF-Access-Client-Id": context.env.API_CLIENT_ID,
        "CF-Access-Client-Secret": context.env.API_CLIENT_SECRET
    };

    const finalOptions = {
        ...options,
        headers
    };

    return fetch(url, finalOptions);
}
