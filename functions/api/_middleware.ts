import { jwtVerify, JWTVerifyResult } from 'jose';
import {Env, User} from "../../types"
import {EventContext} from "@cloudflare/workers-types";


export const onRequest = async (context: EventContext<Env,never,never>) => {
    const noContent = new Response(
        JSON.stringify({ error: 'No token provided' }),
        {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        }
    );

    const { env, request, next } = context;

    const url = new URL(request.url);
    console.log(url.pathname);
    if (url.pathname === '/api/auth/login' || url.pathname === '/' || url.pathname === '/api/auth/cas') {
        console.log("Bypassing middleware. Redirect to:", url.pathname);
        console.log(request.url)

        return next(request);
    }


    const cookies = request.headers.get('cookie');


    const regexMatch = cookies?.match(/auth_token=([A-Za-z0-9_.-]+)/);
    if (!regexMatch) {
        return noContent;
    }
    const token = regexMatch[1];
    if (!token) {
        return noContent;
    }

    try {
        const secret = new TextEncoder().encode(env.TESTKEY);

        const { payload } : JWTVerifyResult<User> = await jwtVerify(token, secret, {
            algorithms: ['HS256']
        });


        request.headers.set('X-Username', payload.username.toString());

        return next(request);

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