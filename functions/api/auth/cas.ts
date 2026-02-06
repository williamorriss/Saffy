import { XMLParser } from 'fast-xml-parser';
import {SignJWT} from 'jose';
import type { Env ,User } from '../../../types'
import {EventContext} from '@cloudflare/workers-types';

export async function onRequest(context: EventContext<Env, never, never>): Promise<Response> {
    const { request, env } = context;
    const url = new URL(request.url);
    const ticket =  url.searchParams.get('ticket');
    if (!ticket) {
        throw new Error('Could not find ticket');
    }

    const service = url.origin + '/api/auth/cas';


    const casValidate = new URL(`https://${env.AUTH}/serviceValidate`);
    casValidate.searchParams.append('service', service);
    casValidate.searchParams.append('ticket', ticket);

    const username = await fetch(casValidate, {
            method: 'GET',
        }).then(parseXMLResponse);


    if (username) {
        console.log(username);
        console.log(env.TESTKEY)
        const payload: User = {username: username};
        const secretKey = new TextEncoder().encode(env.TESTKEY);
        const token = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(secretKey);

        return new Response(null, {
            status: 301,
            headers: {
                'Location': url.origin + '?auth=true',
                'Set-Cookie': `auth_token=${token}; HttpOnly; Path=/; Max-Age=7200; SameSite=Strict`,
                'Content-Type': 'application/json'
            }
        });
    }

    return Response.redirect(url.origin, 301);

}

async function parseXMLResponse(response: Response) : Promise<string | null> {
    try {
        const parser = new XMLParser();
        const xmlResponse = parser.parse(await response.text());

        if ('cas:authenticationSuccess' in xmlResponse['cas:serviceResponse']) {
            return xmlResponse['cas:serviceResponse']['cas:authenticationSuccess']['cas:user'];
        }
        return null;

    } catch (error) {
        console.error(error);
        return null;
    }
}