import type { BangumiOAuthResponse } from './shares'
import { launchWebAuthFlowAsync } from '@/libs/utils'
import { exchangeCode, WXT_BGM_APP_ID } from './shares'

interface Session {
  access_token: string
  expires_at: number
  refresh_token: string
  user_id: string
}

// Thinking: the best practice to manage the session across all content scripts?
export class BangumiSession {
  private static _session: Session | null = null
  static get session() {
    if (BangumiSession.valid) {
      return BangumiSession._session
    }
    return null
  }

  static logout() {
    BangumiSession._session = null
  }

  static newSession(token: BangumiOAuthResponse) {
    if (token.token_type !== 'Bearer') {
      throw new Error(`Invalid token type: ${token.token_type}`)
    }
    const { access_token, expires_in, refresh_token, user_id } = token
    const expires_at = Math.floor(Date.now() / 1000) + expires_in
    BangumiSession._session = {
      access_token,
      expires_at,
      refresh_token,
      user_id,
    }
  }

  /**
   * Check if the session exists and not expired.
   */
  static get valid() {
    if (!BangumiSession._session) {
      return false
    }
    const { expires_at } = BangumiSession._session
    const now = Math.floor(Date.now() / 1000)
    return now < expires_at
  }

  static async launchOAuthFlow() {
    // 当 extension id 变化（比如修改插件名）导致错误时：
    // Unchecked runtime.lastError: Authorization page could not be loaded.
    // 检查 1. Bangumi App 控制台设置的回调地址 2. Worker 的 BGM_REDIRECT_URI 变量
    const code = await launchWebAuthFlowAsync(
      `https://bgm.tv/oauth/authorize?client_id=${WXT_BGM_APP_ID}&response_type=code`,
    )
    const response = await exchangeCode(code)
    return response
  }
}
