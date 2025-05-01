import type { StorageAnime1Episode } from './storage'
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import _ from 'lodash'
import { storageAnime1Episodes } from './storage'

export const queryClient = new QueryClient()

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
        const progressPercent = ((): number => {
          if (ep.duration && Number.isFinite(ep.duration)
            && ep.currentTime && Number.isFinite(ep.currentTime)
          ) {
            return Math.min(Math.round((ep.currentTime / ep.duration) * 100), 100)
          }
          return Number.NaN
        })()
        return {
          ...ep,
          episodeNumber,
          displayEpisodeNumber,
          progressPercent,
        }
      })

      return _.keyBy(richAnime1Episodes, 'id')
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

export function useAnime1EpisodeBatchUpdate() {
  return useMutation({
    mutationFn: async (batch: StorageAnime1Episode[]) => {
      const anime1Episodes = await storageAnime1Episodes.getValue()
      const anime1EpisodesMap = _.keyBy(anime1Episodes, 'id')
      batch.forEach((episode) => {
        const oldEpisode = anime1EpisodesMap[episode.id]
        // Store the latest watching time
        if (
          oldEpisode
          && oldEpisode.title === episode.title
          && oldEpisode.duration.toFixed(2) === episode.duration.toFixed(2)
          && oldEpisode.currentTime >= episode.currentTime
        ) {
          return
        }
        anime1EpisodesMap[episode.id] = episode
      })
      await storageAnime1Episodes.setValue(Object.values(anime1EpisodesMap))
      return anime1EpisodesMap
    },
    onSuccess(data) {
      queryClient.setQueryData(['anime1Episodes'], data)
    },
  })
}
