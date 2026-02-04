import { jwtVerify } from 'jose';

export const onRequest = async (context) => {
    const { env, request, next } = context;

    const url = new URL(request.url);
    console.log(url.pathname);
    if (url.pathname === '/api/login' || url.pathname === '/' || url.pathname === '/api/cas') {
        return next();
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return new Response(
            JSON.stringify({ error: 'No token provided' }),
            {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    try {
        const secret = new TextEncoder().encode(env.TESTSECRET);

        const { payload } = await jwtVerify(token, secret, {
            algorithms: ['HS256']
        });

        const newRequest = new Request(request);
        newRequest.headers.set('X-Username', payload.username.toString());

        return next({request: newRequest});

    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: 'Invalid token' }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};