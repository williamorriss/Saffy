export default {
    async fetch(request, env, _ctx) {
        try {
            const url = new URL(request.url);

            if (url.pathname.startsWith("/api")) {
                const backend = env.VITE_BACKEND_URL;
                if (!backend) {
                    return new Response("Backend URL not set", { status: 500 });
                }

                const targetUrl = new URL(url.pathname + url.search, backend);
                const backendHost = new URL(backend).host;

                const headers = new Headers(request.headers);
                headers.set("Host", targetUrl.hostname);
                headers.delete("CF-Connecting-IP");

                const response = await fetch(targetUrl.toString(), {
                    method: request.method,
                    headers,
                    body: request.body,
                    redirect: "manual",
                });

                const newResponse = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: new Headers(response.headers),
                });

                // Only rewrite Location if it points to backend — not external URLs (e.g. CAS)
                if (response.status >= 300 && response.status < 400) {
                    const location = response.headers.get("Location");
                    if (location) {
                        try {
                            const loc = new URL(location);
                            if (loc.host === backendHost) {
                                loc.host = url.host;
                                loc.protocol = url.protocol;
                                newResponse.headers.set("Location", loc.toString());
                            }
                        } catch {
                            // Relative URL - fine as-is
                        }
                    }
                }

                return newResponse;
            }

            try {
                const response = await env.ASSETS.fetch(request);
                if (response.status === 404) {
                    return await env.ASSETS.fetch(new Request(new URL("/index.html", request.url).toString(), request));
                }
                return response;
            } catch {
                return new Response("Asset not found", { status: 404 });
            }
        } catch (e) {
            console.log(e);
            return new Response(e.toString(), { status: 500 });
        }
    },
};