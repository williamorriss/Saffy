export async function onRequest(context) {
    const url = new URL(context.request.url);
    throw new Error();
}