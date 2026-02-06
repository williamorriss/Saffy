import type {Env} from '../../../types'
import {EventContext} from '@cloudflare/workers-types';


export async function onRequest(context: EventContext<Env, never, never>) : Promise<Response> {
    const { request, env } = context;

    const url = new URL(request.url);

    const casRedirect = new URL(`https://${env.AUTH}/login`)
    casRedirect.searchParams.append('service', url.origin + '/api/auth/cas');
    casRedirect.searchParams.append('renew', 'true');

    return Response.redirect(casRedirect, 307);
}