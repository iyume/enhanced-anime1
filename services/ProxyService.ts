import { defineProxyService } from '@webext-core/proxy-service'

// NOTE: An error occurs in the background script will be serialized via `serialize-error`
// and passed to the content script, non-error objects will be dropped and return `NonError`.
class ProxyService {
  async fetch(url: string, options?: RequestInit) {
    const response = await fetch(url, options)
    return response.json()
  }
}

export const [registerProxyService, getProxyService]
= defineProxyService('ProxyService', () => new ProxyService(), { logger: console })
