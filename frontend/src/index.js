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
                const proxyRequest = new Request(targetUrl.toString(), request);
                proxyRequest.headers.set("Host", targetUrl.hostname);

                const response = await fetch(proxyRequest);

                const newResponse = new Response(response.body, response);
                const cookies = response.headers.getAll("Set-Cookie");
                newResponse.headers.delete("Set-Cookie");
                for (const cookie of cookies) {
                    const rewritten = cookie.replace(/;\s*Domain=[^;]*/i, "");
                    newResponse.headers.append("Set-Cookie", rewritten);
                }
                return newResponse;
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