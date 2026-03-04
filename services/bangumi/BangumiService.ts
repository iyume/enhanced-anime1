import type { FetchResponse } from 'openapi-fetch'
import type { components, paths } from '../../libs/gen/bangumi-v0'

import type { EpisodeCollectionType } from './shares'
import { defineProxyService } from '@webext-core/proxy-service'
import createFetchClient from 'openapi-fetch'
import { BangumiSession } from './BangumiSession'

const BGM_API_BASE = 'https://api.bgm.tv'

const WXT_WORKER_URL = import.meta.env.WXT_WORKER_URL
if (!WXT_WORKER_URL) {
  throw new Error('BangumiService: WXT_WORKER_URL is not configured')
}

const fetchClient = createFetchClient<paths>({
  baseUrl: BGM_API_BASE,
})
fetchClient.use({
  onRequest: ({ request }) => {
    // Thinking: how to get the token from the background script without  sharing the react state?

    // If the session is valid, set the authorization header
    if (BangumiSession.session) {
      const { access_token } = BangumiSession.session
      request.headers.set('Authorization', `Bearer ${access_token}`)
    }
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

  // Bangumi Info Card
  // Fetching from bangumi-data worker to get subject id using matching anime title and then fetch anime details from BGM API using the subject id 

  async fetchBgmSubject(subjectId: string, urlTemplate?: string): Promise<BgmSubject> {
    const subjectIdNum = Number(subjectId)
    const response = await fetchClient.GET('/v0/subjects/{subject_id}', {
      params: { path: { subject_id: subjectIdNum } },
    })
    const data = response.data
    if (data == null || typeof data !== 'object') {
      const res = response.response
      const msg = response.error ?? (res ? `${res.status} ${res.statusText}` : 'No data')
      throw new Error(`[BangumiService] BGM API error: ${msg} for /v0/subjects/${subjectId}`)
    }
    const bangumi_url = urlTemplate ? urlTemplate.replace('{{id}}', String(data.id)) : undefined
    return {
      id: data.id,
      name: data.name ?? '',
      name_cn: data.name_cn ?? '',
      summary: data.summary ?? '',
      images: data.images ?? { common: '' },
      tags: Array.isArray(data.tags) ? data.tags : [],
      bangumi_url,
    }
  }

  async resolveBgmSubjectBySeriesTitle(seriesTitle: string): Promise<{
    subject: BgmSubject
    debug: Record<string, unknown>
  } | null> {
    const debug: Record<string, unknown> = {
      step: 'start',
      seriesTitle,
    }

    try {
      const subjectParam = encodeURIComponent(seriesTitle.trim())
      const dataUrl = `${WXT_WORKER_URL}/bangumi-data?subject=${subjectParam}`
      debug.step = 'fetchBangumiData'
      const res = await fetch(dataUrl)
      if (!res.ok) {
        if (res.status === 404) {
          console.error('[enhanced-anime1] Bangumi card: no matching subject in bangumi-data', debug)
          return null
        }
        throw new Error(`bangumi-data request failed: ${res.status} ${res.statusText}`)
      }

      const data = (await res.json()) as BangumiDataJson
      const items = data.items ?? []
      if (items.length === 0) {
        console.error('[enhanced-anime1] Bangumi card: no matching subject in returned bangumi-data', debug)
        return null
      }

      const item = items[0]
      const subjectId = item.sites?.find(s => s.site === 'bangumi')?.id
      debug.subjectId = subjectId ?? null
      if (!subjectId) {
        console.error('[enhanced-anime1] Bangumi card: returned item has no bangumi site id', debug)
        return null
      }

      debug.step = 'fetchBgmSubject'
      const urlTemplate = data.siteMeta?.bangumi?.urlTemplate
      const subject = await this.fetchBgmSubject(subjectId, urlTemplate)
      debug.step = 'done'
      return { subject, debug }
    }
    catch (err) {
      debug.step = 'error'
      debug.error = err instanceof Error ? err.message : String(err)
      console.error('[enhanced-anime1] Bangumi card: resolve failed', debug, err)
      return null
    }
  }
}

export const [registerBangumiService, getBangumiService]
  = defineProxyService('BangumiService', () => new BangumiService(), { logger: console })

// Bangumi Info Card Interfaces

export interface BangumiDataSite {
  site: string
  id: string
}

export interface BangumiDataItem {
  title: string
  titleTranslate?: Record<string, string[]>
  sites: BangumiDataSite[]
}

export interface BangumiDataJson {
  siteMeta?: {
    bangumi?: {
      title?: string
      urlTemplate?: string
      type?: string
    }
  }
  items: BangumiDataItem[]
}

export interface BgmSubject {
  id: number
  name: string
  name_cn: string
  summary: string
  images: { common: string }
  tags: Array<{ name: string; count?: number }>
  /** Subject page URL from siteMeta.bangumi.urlTemplate with '{{id}}' replaced by actual subject id. */
  bangumi_url?: string
}