export interface StorageAnime1Info {
  title: string
  episodes: StorageAnime1Episode[]
}

export interface StorageAnime1Episode {
  id: string
  categoryId: string
  title: string
  episode: number | null
  currentTime: number
  duration: number
}

export const storageAnime1Episodes = storage.defineItem<StorageAnime1Episode[]>('local:Anime1Episodes', {
  version: 1,
  fallback: [],
})
