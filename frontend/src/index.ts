import {
    Request as CFRequest,
    Response as CFResponse,
    type Fetcher,
    type ExecutionContext,
    type ExportedHandler,
} from "@cloudflare/workers-types";

interface Env {
    ASSETS: Fetcher;
    VITE_BACKEND_URL: string;
}

export default {
    async fetch(
        request: CFRequest,
        env: Env,
        _ctx: ExecutionContext
    ): Promise<CFResponse> {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api")) {
            const backend = env.VITE_BACKEND_URL;
            const targetUrl = new URL(url.pathname + url.search, backend);

            const proxyRequest = new CFRequest(targetUrl.toString(), request as any);
            proxyRequest.headers.set("Host", targetUrl.hostname);

            const response = await fetch(proxyRequest as any);
            return response as unknown as CFResponse;
        }

        try {
            const response = await env.ASSETS.fetch(request as any);

            if (response.status === 404) {
                const indexRequest = new CFRequest(`${url.origin}/index.html`, request as any);
                const indexResponse = await env.ASSETS.fetch(indexRequest as any);
                return indexResponse as unknown as CFResponse;
            }

            return response as unknown as CFResponse;
        } catch (e) {
            return new Response("Asset not found", { status: 404 }) as unknown as CFResponse;
        }
    },
} satisfies ExportedHandler<Env>;