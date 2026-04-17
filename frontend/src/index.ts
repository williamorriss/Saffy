export interface Env {
    VITE_BACKEND_URL: string;
}

export default {
    async fetch(request: Request, env: Env) {
        const url = new URL(request.url);

        if (!url.pathname.startsWith("/api")) {
            return new Response("Reverse proxy passthrough", {
                status: 200
            });
        }
        const backend = env.VITE_BACKEND_URL;

        if (!backend) {
            return new Response("Backend not set in Env", { status: 500 });
        }

        const targetUrl = backend + url.pathname + url.search;

        return fetch(new Request(targetUrl, request));
    }
}