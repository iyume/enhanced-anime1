/**
 * A cloudflare worker to exchange the bangumi access token from the authorization code.
 */

const BGM_AUTH_URL = 'https://bgm.tv/oauth/access_token'
const BANGUMI_DATA_URL = 'https://unpkg.com/bangumi-data@latest/dist/data.json'
const BANGUMI_DATA_TTL_MS = 24 * 60 * 60 * 1000 // 1 day

// Response headers for GET /bangumi-data.
const BANGUMI_DATA_RESPONSE_HEADERS = {
  'Content-Type': 'application/json',
}

// In-memory storage for bangumi-data
let bangumiDataMemory = null
let bangumiDataCachedAt = 0 // epoch in milliseconds

/** Match item title strings in Traditional Chinese, Simplified Chinese, or English (mirrors getItemTitles in bangumi-resolve.ts). */
function getItemTitles(item) {
  const titles = [item.title]
  const tt = item.titleTranslate
  if (tt) {
    if (Array.isArray(tt['zh-Hans'])) titles.push(...tt['zh-Hans'])
    if (Array.isArray(tt['zh-Hant'])) titles.push(...tt['zh-Hant'])
    if (Array.isArray(tt.en)) titles.push(...tt.en)
  }
  return titles.map(t => String(t).trim()).filter(Boolean)
}

/**
 * Find bangumi-data item by series title (mirrors findBangumiSubjectId in bangumi-resolve.ts).
 */
function findBangumiItem(items, seriesTitle) {
  const normalizedSearch = seriesTitle.trim()
  if (!normalizedSearch) return null

  let lastExactMatch = null
  let lastFuzzyMatch = null
  for (const item of items) {
    const titles = getItemTitles(item)
    const exactMatch = titles.some(t => t === normalizedSearch)
    const fuzzyMatch = !exactMatch && titles.some(
      t => t.includes(normalizedSearch) || normalizedSearch.includes(t),
    )
    if (!exactMatch && !fuzzyMatch) continue

    const site = item.sites?.find(s => s.site === 'bangumi')
    if (!site?.id) continue
    if (exactMatch) lastExactMatch = item
    else lastFuzzyMatch = item
  }
  return lastExactMatch ?? lastFuzzyMatch
}

async function revalidateBangumiDataInMemory() {
  try {
    const res = await fetch(BANGUMI_DATA_URL)
    if (!res.ok) return
    const body = await res.json()
    bangumiDataMemory = body
    bangumiDataCachedAt = Date.now()
  } catch (_) {
    // ignore revalidate errors
  }
}

/**
 * Get bangumi-data JSON. Uses in-memory storage with 1-day TTL and stale-while-revalidate.
 */
async function getBangumiData(request, ctx) {
  const now = Date.now()
  const age = now - bangumiDataCachedAt
  if (bangumiDataMemory !== null) {
    if (age >= BANGUMI_DATA_TTL_MS) {
      ctx.waitUntil(revalidateBangumiDataInMemory())
    }
    return bangumiDataMemory
  }
  const res = await fetch(BANGUMI_DATA_URL)
  if (!res.ok) {
    throw new Error(`bangumi-data fetch failed: ${res.status}`)
  }
  const body = await res.json()
  bangumiDataMemory = body
  bangumiDataCachedAt = now
  return body
}

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
    
    // GET /bangumi-data?subject=... — return best matching item in BangumiDataJson shape
    if (request.method === 'GET' && url.pathname === '/bangumi-data') {
      const subject = url.searchParams.get('subject')
      if (subject === null || subject === undefined || String(subject).trim() === '') {
        return new Response(JSON.stringify({ error: 'Missing or empty subject query' }), {
          status: 400,
          headers: BANGUMI_DATA_RESPONSE_HEADERS,
        })
      }
      try {
        const data = await getBangumiData(request, ctx)
        const items = data.items ?? []
        const item = findBangumiItem(items, subject)
        if (!item) {
          return new Response(JSON.stringify({ error: 'No matching bangumi-data item' }), {
            status: 404,
            headers: BANGUMI_DATA_RESPONSE_HEADERS,
          })
        }
        const payload = {
          siteMeta: data.siteMeta?.bangumi != null ? { bangumi: data.siteMeta.bangumi } : undefined,
          items: [item],
        }
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: BANGUMI_DATA_RESPONSE_HEADERS,
        })
      } catch (err) {
        return new Response(JSON.stringify({ error: err?.message ?? 'Failed to load bangumi-data' }), {
          status: 500,
          headers: BANGUMI_DATA_RESPONSE_HEADERS,
        })
      }
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
