/**
 * A cloudflare worker to exchange the bangumi access token from the authorization code.
 */

const BGM_AUTH_URL = 'https://bgm.tv/oauth/access_token'

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST')
      return new Response('Bad method', { status: 400 })

    const contentType = request.headers.get('Content-Type')
    if (!contentType?.includes('application/json'))
      return new Response('Bad content type', { status: 400 })

    const contentLength = Number.parseInt(request.headers.get('Content-Length'))
    if (isFinite(contentLength) && contentLength > 1000)
      return new Response('Payload too large', { status: 413 })

    let body
    try {
      body = await request.json()
    }
    catch (e) {
      return new Response('Bad json format', { status: 400 })
    }

    if (!body.code || typeof (body.code) !== 'string')
      return new Response('Bad code', { status: 400 })

    const authRequestBody = {
      grant_type: 'authorization_code',
      client_id: env.BGM_CLIENT_ID,
      client_secret: env.BGM_CLIENT_SECRET,
      code: body.code,
      redirect_uri: env.BGM_REDIRECT_URI,
    }
    const authResponse = await fetch(BGM_AUTH_URL, {
      method: 'POST',
      body: JSON.stringify(authRequestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!authResponse.ok)
      return new Response('Authorization failed', { status: 400 })

    return new Response(await authResponse.text(), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },
}
