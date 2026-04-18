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

                // api call
                const response = await fetch(targetUrl.toString(), {
                    method: request.method,
                    headers: request.headers,
                    body: request.body,
                    redirect: "manual",
                });

                const newResponse = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: new Headers(response.headers),
                });

                // Cookie being sent for backend url but using reverse proxy to call backend
                const cookie = response.headers.get("Set-Cookie");
                console.log("original cookie", cookie);
                if (cookie) {
                    const rewritten = cookie
                            .replace(/Domain=[^;]+;?\s*/i, "")
                        + `; Domain=${url.hostname}; Secure; SameSite=Lax`;
                    newResponse.headers.set("Set-Cookie", rewritten);
                    console.log("rewritten cookie", rewritten);
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