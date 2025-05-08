export interface StorageAnime1Episode {
  id: string
  categoryId: string
  title: string
  currentTime: number
  duration: number
}

export const storageAnime1Episodes = storage.defineItem<StorageAnime1Episode[]>('local:Anime1Episodes', {
  version: 1,
  fallback: [],
})

export interface StorageBangumiToken {
  access_token: string
  expires_at: number
  refresh_token: string
}

export const storageBangumiToken = storage.defineItem<StorageBangumiToken | null>('local:BangumiToken', {
  version: 1,
  fallback: null,
})
