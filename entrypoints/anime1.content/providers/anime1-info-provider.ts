import type { IAnime1AnimeInfo } from '../../../libs/types'
import { createContext, use } from 'react'

const provider = createContext<IAnime1AnimeInfo | null>(null)

export const Anime1InfoProvider = provider.Provider

export function useAnime1Info() {
  const context = use(provider)
  if (!context) {
    throw new Error('useAnime1Info must be used within a Anime1InfoProvider')
  }
  return context
}
