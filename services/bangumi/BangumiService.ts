import type { FetchResponse } from 'openapi-fetch'
import type { components, paths } from '../../libs/gen/bangumi-v0'

import type { EpisodeCollectionType } from './shares'
import { defineProxyService } from '@webext-core/proxy-service'
import createFetchClient from 'openapi-fetch'
import { BangumiSession } from './BangumiSession'

const fetchClient = createFetchClient<paths>({
  baseUrl: 'https://api.bgm.tv',
})
fetchClient.use({
  onRequest: ({ request }) => {
    // Thinking: how to get the token from the background script without sharing the react state?
    if (!BangumiSession.session) {
      return new Response('No session', { status: 401 })
    }
    const { access_token } = BangumiSession.session
    request.headers.set('Authorization', `Bearer ${access_token}`)
    return request
  },
})

interface MyFetchResponse {
  status: number
  // It seems difficult to deserialize Headers object comfortably
  // Here use dictionary for convenience
  headers: Record<string, string>
  json: any
  error?: components['schemas']['ErrorDetail'] // Seems always object in bangumi
}

function wrapHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

function wrap<T extends Record<string | number, any>, Options>(
  response: FetchResponse<T, Options, 'application/json'>,
): MyFetchResponse {
  return {
    status: response.response.status,
    headers: wrapHeaders(response.response.headers),
    json: response.data,
    error: response.error,
  }
}

class BangumiService {
  async patchUserSubjectEpisodeCollection(subject_id: number, episode_id: number[], type: EpisodeCollectionType) {
    const response = await fetchClient.PATCH('/v0/users/-/collections/{subject_id}/episodes', {
      params: {
        path: { subject_id },
      },
      body: {
        episode_id,
        type: type as 1,
      },
    })
    return wrap(response)
  }

  async login(force: boolean = false) {
    if (BangumiSession.valid && !force) {
      return
    }
    const token = await BangumiSession.launchOAuthFlow()
    BangumiSession.newSession(token)
  }

  logout() {
    BangumiSession.logout()
  }

  isLoggedIn() {
    return BangumiSession.valid
  }
}

export const [registerBangumiService, getBangumiService]
  = defineProxyService('BangumiService', () => new BangumiService(), { logger: console })
