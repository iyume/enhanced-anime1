import { defineProxyService } from '@webext-core/proxy-service'

interface BangumiOAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string | null
  refresh_token: string
  user_id: string
}

async function exchangeCode(code: string): Promise<BangumiOAuthResponse | null> {
  const exchangerUrl = import.meta.env.WXT_BGM_OAUTH2_WORKER_URL
  if (!exchangerUrl) {
    console.error('Bangumi OAuth2 worker url not found')
    return null
  }
  const response = await fetch(exchangerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })
  if (!response.ok) {
    console.error('Exchange code failed', await response.text())
    return null
  }
  const data = await response.json()
  return data as BangumiOAuthResponse
}

class ProxyService {
  async fetch(url: string, options?: RequestInit) {
    const response = await fetch(url, options)
    return response.json()
  }

  launchBangumiOAuth() {
    const appId = import.meta.env.WXT_BGM_APP_ID
    if (!appId) {
      console.error('Bangumi app id not found')
      return 'error'
    }
    browser.identity.launchWebAuthFlow(
      {
        url: `https://bgm.tv/oauth/authorize?client_id=${appId}&response_type=code`,
        interactive: true,
      },
      // Chrome will check if redirectUrl match https://<app-id>.chromiumapp.org/*
      async (redirectUrl) => {
        if (!redirectUrl) {
          // User cancelled or server error
          console.error('OAuth failed')
          return
        }
        const url = new URL(redirectUrl)
        const code = url.searchParams.get('code')
        if (!code) {
          console.error('Code not found in redirectUrl')
          return
        }
        console.log('code', code)
        // TODO: handle CORS
        const response = await exchangeCode(code)
        console.log('response', response)
      },
    )
    // how to keep flow state?
    return 'processing'
  }
}

export const [registerProxyService, getProxyService]
= defineProxyService('ProxyService', () => new ProxyService())
