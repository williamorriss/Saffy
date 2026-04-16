interface Env {
    BACKEND_URL: string;
    PROXY_SECRET?: string;
}

// reverse proxy for cloudflare

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);

    const targetBase = env.BACKEND_URL;
    const targetUrl = targetBase + url.pathname + url.search;

    const newHeaders = new Headers(request.headers);

    try {
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: newHeaders,
            body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
            redirect: "manual",
        });

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });
    } catch (err) {
        return new Response(`Proxy Error: ${err instanceof Error ? err.message : 'Unknown Error'}`, {
            status: 502
        });
    }
};