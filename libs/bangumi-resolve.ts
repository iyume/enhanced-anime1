const BANGUMI_DATA_URL = 'https://unpkg.com/bangumi-data@latest/dist/data.json'

let cachedBangumiData: BangumiDataJson | null = null

/**
 * Trim anime1 episode title to series title by removing episode number suffix like " [18]".
 * Example: "炎炎消防隊 參之章(第三季) [18]" -> "炎炎消防隊 參之章(第三季)"
 */
export function trimAnime1SeriesTitle(title: string): string {
  return title.replace(/\s*\[\d+\]\s*$/, '').trim()
}

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
      urlTemplate?: string
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
  /** Subject page URL from siteMeta.bangumi.urlTemplate with {{id}} replaced by subject id. */
  bangumi_url?: string
}

export async function getBangumiData(): Promise<BangumiDataJson> {
  if (cachedBangumiData) return cachedBangumiData
  const res = await fetch(BANGUMI_DATA_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch bangumi-data: ${res.status} ${res.statusText}`)
  }
  const data = await res.json() as BangumiDataJson
  cachedBangumiData = data
  return data
}

/** Collect all possible title strings from an item for matching. */
function getItemTitles(item: BangumiDataItem): string[] {
  const titles: string[] = [item.title]
  const tt = item.titleTranslate
  if (tt) {
    if (Array.isArray(tt['zh-Hans'])) titles.push(...tt['zh-Hans'])
    if (Array.isArray(tt['zh-Hant'])) titles.push(...tt['zh-Hant'])
    if (Array.isArray(tt.en)) titles.push(...tt.en)
  }
  return titles.map(t => t.trim()).filter(Boolean)
}

/**
 * Find bangumi subject id from bangumi-data items by matching the category title.
 * Matches against item.title and titleTranslate (zh-Hans, zh-Hant, en).
 * Exact match (t === normalizedSearch) is preferred; then fuzzy (includes) as fallback.
 * Among same tier, returns the last matching item so the latest season/entry is prioritized.
 */
export function findBangumiSubjectId(items: BangumiDataItem[], seriesTitle: string): string | null {
  const normalizedSearch = seriesTitle.trim()
  if (!normalizedSearch) return null

  let lastExactMatch: string | null = null
  let lastFuzzyMatch: string | null = null
  for (const item of items) {
    const titles = getItemTitles(item)
    const exactMatch = titles.some(t => t === normalizedSearch)
    const fuzzyMatch = !exactMatch && titles.some(
      t => t.includes(normalizedSearch) || normalizedSearch.includes(t),
    )
    if (!exactMatch && !fuzzyMatch) continue

    const site = item.sites?.find(s => s.site === 'bangumi')
    if (!site?.id) continue
    if (exactMatch) lastExactMatch = site.id
    else lastFuzzyMatch = site.id
  }
  return lastExactMatch ?? lastFuzzyMatch
}

const BGM_API_BASE = 'https://api.bgm.tv'

export async function fetchBgmSubject(subjectId: string): Promise<BgmSubject> {
  const url = `${BGM_API_BASE}/v0/subjects/${subjectId}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`BGM API error: ${res.status} ${res.statusText} for ${url}`)
  }
  const data = await res.json()
  const bangumiData = await getBangumiData()
  const urlTemplate = bangumiData.siteMeta?.bangumi?.urlTemplate
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

/**
 * Resolve series title to BGM subject: fetch bangumi-data, find item, get bangumi id, fetch subject.
 * Returns subject or null if any step fails.
 */
export async function resolveBgmSubjectBySeriesTitle(seriesTitle: string): Promise<{
  subject: BgmSubject
  debug: Record<string, unknown>
} | null> {
  const debug: Record<string, unknown> = {
    step: 'start',
    seriesTitle,
  }

  try {
    debug.step = 'getBangumiData'
    const data = await getBangumiData()
    debug.itemsCount = data.items?.length ?? 0

    const subjectId = findBangumiSubjectId(data.items ?? [], seriesTitle)
    debug.step = 'findBangumiSubjectId'
    debug.subjectId = subjectId ?? null

    if (!subjectId) {
      console.error('[enhanced-anime1] Bangumi card: no matching subject in bangumi-data', debug)
      return null
    }

    debug.step = 'fetchBgmSubject'
    const subject = await fetchBgmSubject(subjectId)
    debug.step = 'done'
    debug.subjectId = subjectId
    return { subject, debug }
  }
  catch (err) {
    debug.step = 'error'
    debug.error = err instanceof Error ? err.message : String(err)
    console.error('[enhanced-anime1] Bangumi card: resolve failed', debug, err)
    return null
  }
}
