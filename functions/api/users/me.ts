import type { Env} from '../../../types'
import {EventContext} from '@cloudflare/workers-types';


export async function onRequestGet(context: EventContext<Env, never, never>): Promise<Response> {
    const { request } = context;
    const username = request.headers.get('X-Username');
    return Response.json({username})
}