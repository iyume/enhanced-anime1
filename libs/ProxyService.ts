import { defineProxyService } from '@webext-core/proxy-service'

class ProxyService {
  async fetch(url: string, options?: RequestInit) {
    const response = await fetch(url, options)
    return response.json()
  }

  launchBangumiOAuth() {
    const appId = import.meta.env.WXT_BANGUMI_APP_ID
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
      (redirectUrl) => {
        if (!redirectUrl) {
          // User cancelled
          console.error('OAuth failed')
          return
        }
        // Parse the redirectUrl to get the code
        const url = new URL(redirectUrl)
        const code = url.searchParams.get('code')
        if (!code) {
          console.error('Code not found in redirectUrl')
          return
        }
        console.log('redirectUrl', redirectUrl)
        console.log('code', code)
      },
    )
    // how to keep flow state?
    return 'processing'
  }
}

export const [registerProxyService, getProxyService]
= defineProxyService('ProxyService', () => new ProxyService())
