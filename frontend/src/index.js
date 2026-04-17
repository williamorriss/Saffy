export default {
    async fetch(request, env, _ctx) {
        try {
            const apiRequest = request.url.match(/.*\/api(.*)/);
            if (apiRequest !== null) {
                const backend = env.VITE_BACKEND_URL;
                const apiPath = apiRequest[1];
                const targetUrl = new URL("/api" + apiPath, backend);

                const proxyRequest = new Request(targetUrl.toString(), request);
                proxyRequest.headers.set("Host", targetUrl.hostname);

                return fetch(proxyRequest);
            }

            try {
                const response = await env.ASSETS.fetch(request);

                if (response.status === 404) {
                    const indexRequest = new Request(
                        new URL("/index.html", request.url).toString(),
                        request
                    );
                    return await env.ASSETS.fetch(indexRequest);
                }

                return response;
            } catch (e) {
                return new Response("Asset not found", { status: 404 });
            }
        } catch (e) {
            console.log(e);
            return new Response(e.toString(), { status: 500 });
        }
    },
};