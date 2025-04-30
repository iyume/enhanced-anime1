import type { FC } from 'react'
import { useAnime1EpisodeQuery } from '@/libs/query'
import _ from 'lodash'

function useDocumentMutationObserver(callback: MutationCallback) {
  const [isEnabled, setIsEnabled] = useState(true)
  const observerRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    if (!isEnabled) {
      return
    }
    observerRef.current = new MutationObserver(callback)
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    })
    return () => {
      observerRef.current?.disconnect()
    }
  }, [callback, isEnabled])

  const enable = useCallback(() => {
    setIsEnabled(true)
  }, [])

  const disable = useCallback(() => {
    setIsEnabled(false)
    observerRef.current?.disconnect()
  }, [])

  return { enable, disable }
}

// Parse //anime1.me/?cat=1651
function parseCategoryIdFromUrl(url: string): string {
  const match = url.match(/cat=(\d+)/)
  if (match) {
    return match[1]
  }
  return ''
}

export const Anime1HomeUIInject: FC = () => {
  const { data } = useAnime1EpisodeQuery()
  const [titleTdElements, setTitleTdElements] = useState<Element[]>([])

  useDocumentMutationObserver((mutations) => {
    // Skip changes for data-is-anime1-tracker
    const isAnime1Tracker = mutations.some((mutation) => {
      const target = mutation.target as HTMLElement
      return target.dataset.isAnime1Tracker === 'true'
    })
    if (isAnime1Tracker) {
      return
    }
    const elements = Array.from(document.querySelectorAll('table tbody tr td:nth-child(1)')) as HTMLTableCellElement[]
    setTitleTdElements(Array.from(elements))
  })

  useEffect(() => {
    console.log('Process', titleTdElements)
    titleTdElements.forEach((td) => {
      if (td.children.length > 1) {
        return
      }
      const a = td.querySelector('a') as HTMLAnchorElement
      if (!a) {
        return
      }
      const categoryId = parseCategoryIdFromUrl(a.href)
      if (!categoryId) {
        return
      }
      const episodes = data && Object.values(data).filter(episode => episode.categoryId === categoryId)
      if (!episodes || !episodes.length) {
        return
      }
      const lastEpisode = _.maxBy(episodes, e => e.episode)!
      const progressBadge = document.createElement('span')
      progressBadge.dataset.isAnime1Tracker = 'true'
      progressBadge.className = 'anime1-tracker-progress-badge'
      progressBadge.style = `
        background-color: #ff0000;
        color: #fff;
        margin-left: 5px;
        `
      progressBadge.textContent = `(${lastEpisode.episode})`
      td.appendChild(progressBadge)
    })
  }, [titleTdElements, data])

  return null
}
