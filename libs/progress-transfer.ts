import type { StorageAnime1Episode } from './storage'

/**
 * Marker written into exported files. It keeps us from importing an unrelated
 * JSON file (e.g. anime1's own animelist.json) and silently trashing the data.
 */
export const PROGRESS_FILE_FORMAT = 'enhanced-anime1/progress'
export const PROGRESS_FILE_VERSION = 1

export interface ProgressFile {
  format: typeof PROGRESS_FILE_FORMAT
  version: number
  exportedAt: number
  appVersion: string
  episodes: StorageAnime1Episode[]
}

export interface ProgressSummary {
  categoryCount: number
  episodeCount: number
  lastUpdatedAt: number | null
}

export interface MergeResult {
  /** The full episode list to write back to the storage. */
  episodes: StorageAnime1Episode[]
  added: number
  updated: number
  /** Incoming entries that are older than what we already have locally. */
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

/** Returns `null` for anything that is not a well-formed episode record. */
function parseEpisode(raw: unknown): StorageAnime1Episode | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  const { id, categoryId, title, currentTime, duration, updatedAt }
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

  return {
    id,
    categoryId,
    title,
    // Negative values would render as a broken progress bar
    currentTime: Math.max(0, currentTime),
    duration: Math.max(0, duration),
    updatedAt,
  }
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

export function createProgressFile(episodes: StorageAnime1Episode[], appVersion: string): ProgressFile {
  return {
    format: PROGRESS_FILE_FORMAT,
    version: PROGRESS_FILE_VERSION,
    exportedAt: Date.now(),
    appVersion,
    episodes: sortEpisodes(episodes),
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

/**
 * Parses an exported file. Throws an `Error` carrying a message that is meant
 * to be shown to the user as-is.
 */
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

  const { format, version, exportedAt, appVersion, episodes } = raw as Record<string, unknown>
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
  }
}

/**
 * Merges the incoming episodes into the local ones. Same episode id keeps
 * whichever record was updated most recently, so nothing is ever deleted.
 */
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
      byId.set(episode.id, episode)
      updated += 1
    }
    else {
      skipped += 1
    }
  }

  return { episodes: [...byId.values()], added, updated, skipped }
}
