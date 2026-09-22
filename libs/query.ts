import type { StorageAnime1Category, StorageAnime1Episode } from './storage'
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'es-toolkit'
import { storageAnime1Categories, storageAnime1Episodes } from './storage'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
})

export interface IAnime1RichEpisode extends StorageAnime1Episode {
  episodeNumber: number | null
  displayEpisodeNumber: string
  categoryTitle: string // The parsed title, prefer to useAnime1Data
  displayCurrentTime: string
  displayDuration: string
  progressPercent: number
  isFinished: boolean
}

const FINISHED_PROGRESS_PERCENT = 90

function computeProgressPercent(
  episode: Pick<StorageAnime1Episode, 'currentTime' | 'duration'>,
): number {
  const { currentTime, duration } = episode
  if (!duration || !Number.isFinite(duration)
    || !currentTime || !Number.isFinite(currentTime)) {
    return Number.NaN
  }
  return Math.min(Math.floor((currentTime / duration) * 100), 100)
}

function getDisplayTime(time: number) {
  if (time && Number.isFinite(time)) {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  return '00:00'
}

export function useAnime1EpisodeQuery() {
  return useQuery({
    queryKey: ['anime1Episodes'],
    queryFn: async () => {
      const anime1Episodes = await storageAnime1Episodes.getValue()

      const richAnime1Episodes = anime1Episodes.map((ep) => {
        const episodeNumber = ((): number | null => {
          // Parse episode from title `title [01]`
          // 有可能是剧场版 https://anime1.me/category/2024%e5%b9%b4%e6%98%a5%e5%ad%a3/%e5%8a%87%e5%a0%b4%e7%b8%bd%e9%9b%86%e7%af%87-%e5%ad%a4%e7%8d%a8%e6%90%96%e6%bb%be-re
          const episodeMatch = ep.title.match(/\[(\d+)\]/)
          return episodeMatch ? Number.parseInt(episodeMatch[1], 10) : null
        })()
        const displayEpisodeNumber = `${episodeNumber ?? '剧场版'}`.padStart(2, '0')
        // Remove [01] from title if exists
        const categoryTitle = ep.title.trim().replace(/\s*\[\d+\]$/, '')
        const progressPercent = computeProgressPercent(ep)
        // 有闩锁则以后者为准，否则退回按进度推导
        const isFinished = ep.finished ?? (progressPercent >= FINISHED_PROGRESS_PERCENT)

        return {
          ...ep,
          episodeNumber,
          displayEpisodeNumber,
          categoryTitle,
          displayCurrentTime: getDisplayTime(ep.currentTime),
          displayDuration: getDisplayTime(ep.duration),
          progressPercent,
          isFinished,
        } satisfies IAnime1RichEpisode
      })

      return keyBy(richAnime1Episodes, ep => ep.id)
    },
  })
}

// Avoid unnecessary re-rendering (?)
export function useAnime1EpisodeRefetch() {
  const client = useQueryClient()
  return useCallback(() => {
    // refetchQueries?
    return client.invalidateQueries({ queryKey: ['anime1Episodes'] })
  }, [client])
}

export function useAnime1CategoriesRefetch() {
  const client = useQueryClient()
  return useCallback(() => {
    return client.invalidateQueries({ queryKey: ['anime1Categories'] })
  }, [client])
}

export function useAnime1EpisodeBatchUpdate() {
  return useMutation({
    mutationFn: async (batch: StorageAnime1Episode[]) => {
      const anime1Episodes = await storageAnime1Episodes.getValue()
      const anime1EpisodesMap = keyBy(anime1Episodes, ep => ep.id)
      let changed = false
      batch.forEach((episode) => {
        const stored = anime1EpisodesMap[episode.id]
        // 进度一致则不更新，主要是 updatedAt
        if (stored && stored.currentTime === episode.currentTime && stored.duration === episode.duration) {
          return
        }
        anime1EpisodesMap[episode.id] = {
          ...episode,
          finished: stored?.finished === true
            || computeProgressPercent(episode) >= FINISHED_PROGRESS_PERCENT,
        }
        changed = true
      })
      if (!changed) {
        return anime1EpisodesMap
      }
      await storageAnime1Episodes.setValue(Object.values(anime1EpisodesMap))
      return anime1EpisodesMap
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['anime1Episodes'] })
    },
  })
}

export function useAnime1CategoriesQuery() {
  return useQuery({
    queryKey: ['anime1Categories'],
    queryFn: async () => keyBy(await storageAnime1Categories.getValue(), category => category.id),
  })
}

export function useAnime1CategoriesMutation() {
  return useMutation({
    mutationFn: async (input: { categoryId: string, archived: boolean }) => {
      const { categoryId, archived } = input
      const current = await storageAnime1Categories.getValue()
      const record: StorageAnime1Category = {
        ...current.find(category => category.id === categoryId),
        id: categoryId,
        archivedAt: archived ? Date.now() : null,
      }
      await storageAnime1Categories.setValue(
        current.some(category => category.id === categoryId)
          ? current.map(category => (category.id === categoryId ? record : category))
          : [...current, record],
      )
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['anime1Categories'] })
    },
  })
}

type Anime1DataRaw = [
  number, // Identifier
  string, // Title or <a href="...">Title</a>
  string, // Status / Episode Count (e.g., "連載中(08)", "劇場版", "1-12", "1-12+OVA1-3")
  string, // Year (e.g., "2025")
  string, // Season (e.g., "春")
  string, // Fansub Group (e.g., "桜都", "")
][]

export interface Anime1Category {
  id: number
  title: string
  status: 'airing' | 'completed' | 'ova' | 'movie' | 'unknown'
  parsedEpisode?: string // Only for airing
  rawEpisode?: string // Only for completed
  year: string
  season: string
  fansub: string
}

export function useAnime1CategoryQuery() {
  return useQuery({
    queryKey: ['anime1Category'],
    queryFn: async () => {
      const response = await fetch('https://anime1.me/animelist.json')
      if (!response.ok) {
        throw new Error(`Failed to fetch anime1 data: ${response.statusText}`)
      }
      const data: Anime1DataRaw = await response.json()
      return data.reduce((acc, [id, title, status, year, season, fansub]) => {
        // Parse status & lastEpisode
        let parsedStatus: 'airing' | 'completed' | 'ova' | 'movie' | 'unknown' = 'unknown'
        let parsedEpisode: string | undefined
        let rawEpisode: string | undefined
        status = status.trim()
        let match: RegExpMatchArray | null = null
        // eslint-disable-next-line no-cond-assign
        if (match = status.match(/連載中\((\d+)\)/)) {
          parsedStatus = 'airing'
          parsedEpisode = match[1]
        }
        else if (status === '劇場版') {
          parsedStatus = 'movie'
        }
        // eslint-disable-next-line no-cond-assign
        else if (match = status.match(/^(\d+-\d+)\+?/)) {
          parsedStatus = 'completed'
          rawEpisode = status
        }
        else if (status === 'OVA') {
          parsedStatus = 'ova'
        }
        acc[id] = {
          id,
          title: title.replace(/<a href="[^"]+">([^<]+)<\/a>/, '$1'),
          status: parsedStatus,
          parsedEpisode,
          rawEpisode,
          year,
          season,
          fansub,
        }
        return acc
      }, {} as Record<string, Anime1Category>)
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
