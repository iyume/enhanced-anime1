import { QueryClient, useQuery } from '@tanstack/react-query'
import { storageAnime1Episodes } from './storage'

export const queryClient = new QueryClient()

export function useAnime1EpisodeQuery() {
  return useQuery({
    queryKey: ['anime1Episodes'],
    queryFn: async () => {
      const anime1Episodes = await storageAnime1Episodes.getValue()
      return anime1Episodes
    },
  })
}
