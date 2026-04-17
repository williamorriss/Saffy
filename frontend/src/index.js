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

                const headers = new Headers(request.headers);
                headers.set("Host", targetUrl.hostname);
                headers.delete("CF-Connecting-IP");

                const proxyRequest = new Request(targetUrl.toString(), {
                    method: request.method,
                    headers,
                    body: request.body,
                    redirect: "manual",
                });

                const response = await fetch(proxyRequest);

                const newResponse = new Response(response.body, response);
                const cookies = response.headers.getAll("Set-Cookie");
                newResponse.headers.delete("Set-Cookie");

                for (const cookie of cookies) {
                    const rewritten = cookie
                            .replace(/;\s*Domain=[^;]*/i, "")
                            .replace(/;\s*SameSite=[^;]*/i, "")
                            .replace(/;\s*Secure/i, "")
                        + "; SameSite=Lax";
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