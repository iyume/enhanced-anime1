import type { StorageAnime1Category, StorageAnime1Episode } from './storage'

/**
 * Marker written into exported files. It keeps us from importing an unrelated
 * JSON file (e.g. anime1's own animelist.json) and silently trashing the data.
 */
export const PROGRESS_FILE_FORMAT = 'enhanced-anime1/progress'

/**
 * Changelog:
 * v1 → v2：Add field `categories`
 */
export const PROGRESS_FILE_VERSION = 2

export interface ProgressFile {
  format: typeof PROGRESS_FILE_FORMAT
  version: number
  exportedAt: number
  appVersion: string
  episodes: StorageAnime1Episode[]
  categories: StorageAnime1Category[]
}

export interface ProgressSummary {
  categoryCount: number
  episodeCount: number
  lastUpdatedAt: number | null
}

export interface MergeResult {
  episodes: StorageAnime1Episode[]
  added: number
  updated: number
  skipped: number
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function sortEpisodes(episodes: StorageAnime1Episode[]) {
  return [...episodes].sort((a, b) =>
    a.categoryId.localeCompare(b.categoryId) || a.id.localeCompare(b.id),
  )
}

function parseEpisode(raw: unknown): StorageAnime1Episode | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  const { id, categoryId, title, currentTime, duration, updatedAt, finished }
    = raw as Record<string, unknown>

  if (typeof id !== 'string' || !id) {
    return null
  }
  if (typeof categoryId !== 'string' || !categoryId) {
    return null
  }
  if (typeof title !== 'string') {
    return null
  }
  if (!isFiniteNumber(currentTime) || !isFiniteNumber(duration) || !isFiniteNumber(updatedAt)) {
    return null
  }

  const episode: StorageAnime1Episode = {
    id,
    categoryId,
    title,
    currentTime: Math.max(0, currentTime),
    duration: Math.max(0, duration),
    updatedAt,
  }
  if (finished === true) {
    episode.finished = true
  }
  return episode
}

export function summarizeEpisodes(episodes: StorageAnime1Episode[]): ProgressSummary {
  return {
    categoryCount: new Set(episodes.map(episode => episode.categoryId)).size,
    episodeCount: episodes.length,
    lastUpdatedAt: episodes.length
      ? Math.max(...episodes.map(episode => episode.updatedAt))
      : null,
  }
}

function parseCategories(raw: unknown): StorageAnime1Category[] {
  if (!Array.isArray(raw)) {
    return []
  }
  const result: StorageAnime1Category[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue
    }
    const { id, archivedAt } = item as Record<string, unknown>
    if (typeof id !== 'string' || !id) {
      continue
    }
    if (!isFiniteNumber(archivedAt) || archivedAt <= 0) {
      continue
    }
    result.push({ id, archivedAt })
  }
  return result
}

export interface MergeCategoriesResult {
  categories: StorageAnime1Category[]
  added: number
}

export function mergeCategories(
  local: StorageAnime1Category[],
  incoming: StorageAnime1Category[],
): MergeCategoriesResult {
  const byId = new Map(local.map(category => [category.id, category]))
  let added = 0
  for (const category of incoming) {
    const existing = byId.get(category.id)
    if (!existing) {
      byId.set(category.id, category)
      added += 1
      continue
    }
    if ((category.archivedAt ?? 0) > (existing.archivedAt ?? 0)) {
      byId.set(category.id, category)
    }
  }
  return { categories: [...byId.values()], added }
}

export function createProgressFile(
  episodes: StorageAnime1Episode[],
  categories: StorageAnime1Category[],
  appVersion: string,
): ProgressFile {
  return {
    format: PROGRESS_FILE_FORMAT,
    version: PROGRESS_FILE_VERSION,
    exportedAt: Date.now(),
    appVersion,
    episodes: sortEpisodes(episodes),
    categories: [...categories].sort((a, b) => a.id.localeCompare(b.id)),
  }
}

function pad(value: number) {
  return `${value}`.padStart(2, '0')
}

export function formatProgressDateTime(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function progressFileName(now = new Date()) {
  return `enhanced-anime1-progress-${now.getFullYear()}${pad(now.getMonth() + 1)}`
    + `${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.json`
}

export function parseProgressFile(text: string): ProgressFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  }
  catch {
    throw new Error('文件不是合法的 JSON')
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('这不是 Enhanced Anime1 导出的进度文件')
  }

  const { format, version, exportedAt, appVersion, episodes, categories } = raw as Record<string, unknown>
  if (format !== PROGRESS_FILE_FORMAT) {
    throw new Error('这不是 Enhanced Anime1 导出的进度文件')
  }
  if (isFiniteNumber(version) && version > PROGRESS_FILE_VERSION) {
    throw new Error('文件由更新版本的插件导出，请先更新插件')
  }
  if (!Array.isArray(episodes)) {
    throw new TypeError('文件里没有进度数据')
  }

  const parsed = episodes
    .map(parseEpisode)
    .filter((episode): episode is StorageAnime1Episode => episode !== null)

  if (parsed.length === 0) {
    throw new Error('文件里没有可用的进度数据')
  }

  return {
    format: PROGRESS_FILE_FORMAT,
    version: PROGRESS_FILE_VERSION,
    exportedAt: isFiniteNumber(exportedAt) ? exportedAt : 0,
    appVersion: typeof appVersion === 'string' ? appVersion : '',
    episodes: parsed,
    categories: parseCategories(categories),
  }
}

function latchFinished(
  record: StorageAnime1Episode,
  other: StorageAnime1Episode,
): StorageAnime1Episode {
  if (other.finished !== true || record.finished === true) {
    return record
  }
  return { ...record, finished: true }
}

export function mergeEpisodes(
  local: StorageAnime1Episode[],
  incoming: StorageAnime1Episode[],
): MergeResult {
  const byId = new Map(local.map(episode => [episode.id, episode]))
  let added = 0
  let updated = 0
  let skipped = 0

  for (const episode of incoming) {
    const existing = byId.get(episode.id)
    if (!existing) {
      byId.set(episode.id, episode)
      added += 1
    }
    else if (episode.updatedAt > existing.updatedAt) {
      byId.set(episode.id, latchFinished(episode, existing))
      updated += 1
    }
    else {
      byId.set(episode.id, latchFinished(existing, episode))
      skipped += 1
    }
  }

  return { episodes: [...byId.values()], added, updated, skipped }
}
