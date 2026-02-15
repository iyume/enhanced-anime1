import type { FC, PropsWithChildren } from 'react'
import type { Anime1PageType, IAnime1Post } from '@/libs/anime1-site-parser'
import { createContext, use, useMemo, useState } from 'react'
import { getAnime1PageType, parseAnime1ArticlePage, parseAnime1CategoryPage } from '@/libs/anime1-site-parser'
import { sendMainWorldMessage } from '@/libs/messaging'
import { useEffectOnce } from '../hooks/common/useEffectOnce'

interface IAnime1State {
  pageType: Anime1PageType
  // The video list, which is only available on the category page or episode page
  posts: IAnime1Post[]
}

const Context = createContext<IAnime1State | null>(null)

export const Anime1StateProvider: FC<PropsWithChildren> = ({ children }) => {
  const pageType = getAnime1PageType()

  // The video list initializer
  const [posts, setPosts] = useState<IAnime1Post[] | null>(null)

  useEffectOnce(async () => {
    let result: IAnime1Post[] | null = null
    const categoryId = await sendMainWorldMessage('getCategoryId', undefined)
    if (pageType === 'category') {
      const parsed = parseAnime1CategoryPage({ categoryId })
      result = parsed && parsed.episodes
    }
    else if (pageType === 'episode') {
      const parsed = parseAnime1ArticlePage({ categoryId })
      result = parsed && [parsed]
    }
    setPosts(result)
  })

  const state = useMemo(() => ({ pageType, posts: posts || [] }), [pageType, posts])

  console.log('Anime1StateProvider', state)

  return (
    <Context value={state}>
      {children}
    </Context>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAnime1State() {
  const context = use(Context)
  if (!context) {
    throw new Error('useAnime1State must be used within a Anime1StateProvider')
  }
  return context
}
