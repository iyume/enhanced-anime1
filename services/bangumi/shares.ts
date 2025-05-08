// During the response serialization, the status code is not included, so we need to handle it manually
export const ErrorNo = {
  NoSession: 1,
}

export interface BangumiOAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string | null
  refresh_token: string
  user_id: string
}

/**
  - `0`: 未收藏
  - `1`: 想看
  - `2`: 看过
  - `3`: 抛弃
 */
export enum EpisodeCollectionType {
  Uncollected = 0,
  Wish = 1,
  Done = 2,
  Dropped = 3,
}

export const WXT_BGM_OAUTH2_WORKER_URL = import.meta.env.WXT_BGM_OAUTH2_WORKER_URL
if (!WXT_BGM_OAUTH2_WORKER_URL) {
  throw new Error('Bangumi OAuth2 worker URL is not configured')
}
export const WXT_BGM_APP_ID = import.meta.env.WXT_BGM_APP_ID
if (!WXT_BGM_APP_ID) {
  throw new Error('Bangumi app id is not configured')
}

export async function exchangeCode(code: string): Promise<BangumiOAuthResponse> {
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
