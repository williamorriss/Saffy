export async function onRequestGet(context) {
    const {env} = context;
    const _response = await fetch(`https://${env.AUTH}/logout)`, {
        method: 'GET',
    });
}