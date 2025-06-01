/**
 * A cloudflare worker to exchange the bangumi access token from the authorization code.
 */

const BGM_AUTH_URL = 'https://bgm.tv/oauth/access_token'

export default {
  async fetch(request, env, ctx) {
    // if (request.method === 'OPTIONS') {
    //   return new Response('ok', {
    //     status: 200,
    //     headers: {
    //       'Access-Control-Allow-Origin': env.ALLOW_ORIGIN,
    //       'Access-Control-Allow-Methods': 'POST',
    //       'Access-Control-Allow-Headers': '*',
    //     },
    //   })
    // }

    const url = new URL(request.url)

    // Return a simple HTML page for the root path
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bangumi OAuth Token Exchange Service</title>
    <meta name="google-site-verification" content="OF6rlp7DSD7G9Wdy-uLEqbpiGSMOLD9N_94pmPxEcRY" />
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            padding: 20px;
            text-align: center;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Bangumi OAuth Service</h1>
        <p>This service handles OAuth token exchange for Bangumi (bgm.tv) API integration. It securely converts authorization codes into access tokens for authenticated API requests.</p>
    </div>
</body>
</html>`, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }

    if (request.method !== 'POST')
      return new Response('Bad method', { status: 400 })

    const contentType = request.headers.get('Content-Type')
    if (!contentType?.includes('application/json'))
      return new Response('Bad content type', { status: 400 })

    const contentLength = Number.parseInt(request.headers.get('Content-Length'))
    if (Number.isFinite(contentLength) && contentLength > 1000)
      return new Response('Payload too large', { status: 413 })

    let body
    try {
      body = await request.json()
    }
    catch {
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
