import type {Env} from '../../../types'
import {EventContext} from '@cloudflare/workers-types';

export async function onRequest(context: EventContext<Env, never, never>) : Promise<Response> {
    const {env} = context;

    return Response.redirect(`https://${env.AUTH}/logout`, 301)
}