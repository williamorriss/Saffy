export async function onRequest(context) : Promise<Response> {
    const { request, env } = context;
    console.log("login reached", env);

    const url = new URL(request.url);

    const casRedirect = new URL(`https://${env.AUTH}/login`)
    casRedirect.searchParams.append("service", url.origin + "/api/cas");
    casRedirect.searchParams.append("renew", "true");

    return Response.redirect(casRedirect, 307);
}