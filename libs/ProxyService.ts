import { defineProxyService } from '@webext-core/proxy-service'
import { launchWebAuthFlowAsync } from './utils'

interface BangumiOAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string | null
  refresh_token: string
  user_id: string
}

const WXT_BGM_OAUTH2_WORKER_URL = import.meta.env.WXT_BGM_OAUTH2_WORKER_URL
if (!WXT_BGM_OAUTH2_WORKER_URL) {
  throw new Error('Bangumi OAuth2 worker URL is not configured')
}
const WXT_BGM_APP_ID = import.meta.env.WXT_BGM_APP_ID
if (!WXT_BGM_APP_ID) {
  throw new Error('Bangumi app id is not configured')
}

async function exchangeCode(code: string): Promise<BangumiOAuthResponse> {
  // Must ensure the worker URL is added to host_permissions, otherwise
  // the request will be blocked by CORS
  const response = await fetch(WXT_BGM_OAUTH2_WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })
  if (!response.ok) {
    throw new Error(`Exchanger server error: ${await response.text()}`)
  }
  const data = await response.json()
  return data as BangumiOAuthResponse
}

class ProxyService {
  async fetch(url: string, options?: RequestInit) {
    const response = await fetch(url, options)
    return response.json()
  }

  async launchBangumiOAuth() {
    try {
      const code = await launchWebAuthFlowAsync(
        `https://bgm.tv/oauth/authorize?client_id=${WXT_BGM_APP_ID}&response_type=code`,
      )
      const response = await exchangeCode(code)
      return response
    }
    catch (e) {
      console.error('Launch web auth flow failed', e)
      return null
    }
  }
}

export const [registerProxyService, getProxyService]
= defineProxyService('ProxyService', () => new ProxyService())
