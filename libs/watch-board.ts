import type { Anime1Category, IAnime1RichEpisode } from './query'
import type { StorageAnime1Category } from './storage'

export type WatchBoardGroupId = 'behind' | 'caughtUp' | 'unknown' | 'archived'

export interface WatchBoardSummary {
  latestAvailable: number | null
  reachedEpisode: number
  finishedCount: number
  behindCount: number | null
}

export interface WatchBoardEntry extends WatchBoardSummary {
  categoryId: string
  title: string
  meta: Anime1Category | null
  episodes: IAnime1RichEpisode[]
  lastWatchedAt: number
  lastWatched: IAnime1RichEpisode
  group: WatchBoardGroupId
  archivedAt: number | null
}

export interface WatchBoardGroup {
  id: WatchBoardGroupId
  title: string
  hint?: string
  entries: WatchBoardEntry[]
}

export interface WatchBoard {
  groups: WatchBoardGroup[]
  followingCount: number
  behindSeriesCount: number
}

export function episodeProgressPercent(episode: IAnime1RichEpisode): number {
  return Number.isFinite(episode.progressPercent) ? episode.progressPercent : 0
}

export function hasWatched(episode: IAnime1RichEpisode): boolean {
  return episode.isFinished || episode.currentTime > 0
}

function parseLatestEpisodeNumber(meta: Anime1Category | null | undefined): number | null {
  if (!meta) {
    return null
  }
  if (meta.parsedEpisode) {
    const parsed = Number.parseInt(meta.parsedEpisode, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  const range = meta.rawEpisode?.match(/^(\d+)-(\d+)/)
  if (range) {
    const parsed = Number.parseInt(range[2], 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function reachedEpisode(episodes: IAnime1RichEpisode[]): number {
  return episodes.reduce((reached, episode) => {
    const { episodeNumber } = episode
    if (episodeNumber == null) {
      return reached
    }
    if (hasWatched(episode)) {
      return Math.max(reached, episodeNumber)
    }
    return reached
  }, 0)
}

export function findLastWatched(episodes: IAnime1RichEpisode[]): IAnime1RichEpisode {
  return episodes.reduce((newest, episode) =>
    episode.updatedAt > newest.updatedAt ? episode : newest)
}

export function summarizeSeries(
  episodes: IAnime1RichEpisode[],
  meta: Anime1Category | null | undefined,
): WatchBoardSummary {
  const latestAvailable = parseLatestEpisodeNumber(meta)
  const numbered = episodes.filter(episode => episode.episodeNumber != null)
  const reached = reachedEpisode(numbered)
  return {
    latestAvailable,
    reachedEpisode: reached,
    finishedCount: episodes.filter(episode => episode.isFinished).length,
    behindCount: latestAvailable == null ? null : Math.max(0, latestAvailable - reached),
  }
}

export function isCaughtUp(
  summary: WatchBoardSummary,
  episodes: IAnime1RichEpisode[],
): boolean {
  if (summary.behindCount != null) {
    return summary.behindCount === 0
  }
  if (episodes.some(episode => episode.episodeNumber != null)) {
    return false
  }
  return episodes.length > 0 && episodes.every(episode => episode.isFinished)
}

function sortBoardEpisodes(episodes: IAnime1RichEpisode[]): IAnime1RichEpisode[] {
  return [...episodes].sort((a, b) => {
    if (a.episodeNumber == null && b.episodeNumber == null) {
      return a.updatedAt - b.updatedAt
    }
    if (a.episodeNumber == null) {
      return 1
    }
    if (b.episodeNumber == null) {
      return -1
    }
    return a.episodeNumber - b.episodeNumber
  })
}

function resolveTitle(meta: Anime1Category | null, lastWatched: IAnime1RichEpisode): string {
  const fromMeta = meta?.title?.trim()
  if (fromMeta) {
    return fromMeta
  }
  return lastWatched.categoryTitle.trim() || lastWatched.title
}

function compareByRecent(a: WatchBoardEntry, b: WatchBoardEntry): number {
  return b.lastWatchedAt - a.lastWatchedAt
}

function compareByArchived(a: WatchBoardEntry, b: WatchBoardEntry): number {
  return (b.archivedAt ?? 0) - (a.archivedAt ?? 0)
}

export function buildWatchBoard(
  episodes: Record<string, IAnime1RichEpisode> | undefined,
  categories: Record<string, Anime1Category> | undefined,
  categoryRecords?: Record<string, StorageAnime1Category>,
): WatchBoard {
  const byCategory = new Map<string, IAnime1RichEpisode[]>()
  for (const episode of Object.values(episodes ?? {})) {
    const bucket = byCategory.get(episode.categoryId)
    if (bucket) {
      bucket.push(episode)
    }
    else {
      byCategory.set(episode.categoryId, [episode])
    }
  }

  const entries: WatchBoardEntry[] = []
  for (const [categoryId, bucket] of byCategory) {
    const sorted = sortBoardEpisodes(bucket)
    const meta = categories?.[categoryId] ?? null
    const lastWatched = findLastWatched(sorted)
    const summary = summarizeSeries(sorted, meta)
    const archivedAt = categoryRecords?.[categoryId]?.archivedAt ?? null

    entries.push({
      categoryId,
      title: resolveTitle(meta, lastWatched),
      meta,
      episodes: sorted,
      lastWatchedAt: lastWatched.updatedAt,
      lastWatched,
      ...summary,
      archivedAt,
      group: archivedAt != null
        ? 'archived'
        : isCaughtUp(summary, sorted)
          ? 'caughtUp'
          : summary.behindCount == null ? 'unknown' : 'behind',
    })
  }

  const behind = entries.filter(entry => entry.group === 'behind').sort(compareByRecent)
  const caughtUp = entries.filter(entry => entry.group === 'caughtUp').sort(compareByRecent)
  const unknown = entries.filter(entry => entry.group === 'unknown').sort(compareByRecent)
  const archivedEntries = entries.filter(entry => entry.group === 'archived').sort(compareByArchived)

  const allGroups: WatchBoardGroup[] = [
    {
      id: 'behind',
      title: '落后中',
      entries: behind,
    },
    {
      id: 'caughtUp',
      title: '已追平',
      hint: '已更新的都看完了',
      entries: caughtUp,
    },
    {
      id: 'unknown',
      title: '集数未知',
      hint: 'anime1 没给出集数，算不出看到第几话',
      entries: unknown,
    },
    {
      id: 'archived',
      title: '已废弃',
      hint: '已从看板和首页隐藏',
      entries: archivedEntries,
    },
  ]

  return {
    groups: allGroups.filter(group => group.entries.length > 0),
    followingCount: entries.length - archivedEntries.length,
    behindSeriesCount: behind.length,
  }
}
