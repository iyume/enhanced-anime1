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
      return _.keyBy(anime1Episodes, 'id')
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
