import type { Anime1PageType, IAnime1Video } from '@/libs/anime1-site-parser'
import type { FC, PropsWithChildren } from 'react'
import { getAnime1PageType, parseAnime1ArticlePage, parseAnime1CategoryPage } from '@/libs/anime1-site-parser'
import { sendMainWorldMessage } from '@/libs/messaging'
import { createContext, use } from 'react'
import { useEffectOnce } from '../hooks/common/useEffectOnce'

const Context = createContext<{ pageType: Anime1PageType, videos: IAnime1Video[] } | null>(null)

export const Anime1StateProvider: FC<PropsWithChildren> = ({ children }) => {
  const pageType = getAnime1PageType()

  // The video list initializer
  const [videos, setVideos] = useState<IAnime1Video[] | null>(null)

  useEffectOnce(async () => {
    let result: IAnime1Video[] | null = null
    const categoryId = await sendMainWorldMessage('getCategoryId', undefined)
    if (pageType === 'category') {
      const parsed = parseAnime1CategoryPage({ categoryId })
      result = parsed && parsed.episodes
    }
    else if (pageType === 'episode') {
      const parsed = parseAnime1ArticlePage({ categoryId })
      result = parsed && [parsed]
    }
    setVideos(result)
  })

  const state = useMemo(() => ({ pageType, videos: videos || [] }), [pageType, videos])

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
