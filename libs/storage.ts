export interface StorageAnime1Episode {
  id: string
  categoryId: string
  title: string
  currentTime: number
  duration: number
  updatedAt: number
  finished?: boolean
}

/**
 * Changelog:
 * v1 → v2：Add field `finished`
 */
export const storageAnime1Episodes = storage.defineItem<StorageAnime1Episode[]>('local:Anime1Episodes', {
  version: 2,
  fallback: [],
  migrations: {},
})

export interface StorageAnime1Category {
  id: string
  archivedAt: number | null
}

export const storageAnime1Categories = storage.defineItem<StorageAnime1Category[]>('local:Anime1Categories', {
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

export const storageWidgetPosition = storage.defineItem<{ x: number, y: number }>('local:WidgetPosition', {
  version: 1,
  fallback: { x: 0, y: 0 },
})
