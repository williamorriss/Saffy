export default {
    async fetch(request, env, _ctx) {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api")) {
            const backend = env.VITE_BACKEND_URL;
            const targetUrl = new URL(url.pathname + url.search, backend);

            const proxyRequest = new Request(targetUrl.toString(), request);
            proxyRequest.headers.set("Host", targetUrl.hostname);

            return fetch(proxyRequest);
        }

        try {
            const response = await env.ASSETS.fetch(request);

            if (response.status === 404) {
                const indexRequest = new Request(`${url.origin}/index.html`, request);
                return await env.ASSETS.fetch(indexRequest);
            }

            return response;
        } catch (e) {
            return new Response("Asset not found", { status: 404 });
        }
    },
};