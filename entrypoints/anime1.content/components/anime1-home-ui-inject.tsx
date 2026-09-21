import type { FC } from 'react'
import type { IAnime1RichEpisode } from '@/libs/query'
import { useAnime1CategoriesQuery, useAnime1CategoryQuery, useAnime1EpisodeQuery } from '@/libs/query'
import { openAnime1CategoryPage, setIfChanged } from '@/libs/utils'
import { findLastWatched, isCaughtUp, summarizeSeries } from '@/libs/watch-board'
import { useEffectOnce } from '../hooks/common/useEffectOnce'

const BOARD_BADGE_CLASS = 'anime1-board-badge'
const CAUGHT_UP_CLASS = 'ext-caught-up'

function progressBadgeMarkup(lastWatched: IAnime1RichEpisode): string {
  const label = lastWatched.displayEpisodeNumber === '剧场版'
    ? '上次观看至'
    : `上次观看至 ${lastWatched.displayEpisodeNumber} 话`
  return `
        <span style="font-size: 0.8rem;margin-right: 4px;">▶ </span>
        <span>${label} ${lastWatched.displayCurrentTime}</span>
      `
}

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
  const { data: categoryData } = useAnime1CategoryQuery()
  const { data: categoryRecords } = useAnime1CategoriesQuery()
  const getHomeRows = () => Array.from(document.querySelectorAll('table tbody tr')) as HTMLTableRowElement[]
  const [episodeTrElements, setEpisodeTrElements] = useState<HTMLTableRowElement[]>([])

  useEffectOnce(() => {
    // Because the content script is injected after the page is loaded,
    // the table rows maybe already rendered, so we need to get them manually
    const elements = getHomeRows()
    setIfChanged(episodeTrElements, elements, setEpisodeTrElements)
  })

  useDocumentMutationObserver((mutations) => {
    // Skip changes for data-is-anime1-tracker
    const isAnime1Tracker = mutations.some((mutation) => {
      const target = mutation.target as HTMLElement
      return target.dataset.isAnime1Tracker === 'true'
    })
    if (isAnime1Tracker) {
      return
    }
    const elements = getHomeRows()
    // Check if the elements are the same as before
    // Useful when the page is re-rendered (caused by viewport change)
    setIfChanged(episodeTrElements, elements, setEpisodeTrElements)
  })

  useEffect(() => {
    if (!episodeTrElements.length || !data || !categoryRecords) {
      return
    }
    episodeTrElements.forEach((tr) => {
      const tdList = tr.querySelectorAll('td')
      if (tdList.length < 2) {
        return
      }
      const titleTd = tdList[0]
      const titleAnchor = titleTd.querySelector('a')
      if (!titleAnchor) {
        return
      }
      const categoryId = parseCategoryIdFromUrl(titleAnchor.href)
      if (!categoryId) {
        return
      }
      const episodes = Object.values(data).filter(ep => ep.categoryId === categoryId)
      if (episodes.length === 0) {
        return
      }

      const isArchived = categoryRecords[categoryId]?.archivedAt != null
      const nextDisplay = isArchived ? 'none' : ''
      if (tr.style.display !== nextDisplay) {
        tr.style.display = nextDisplay
      }
      if (isArchived) {
        titleTd.querySelector<HTMLElement>(`.${BOARD_BADGE_CLASS}`)?.remove()
        return
      }

      const summary = summarizeSeries(episodes, categoryData?.[categoryId] ?? null)
      const caughtUp = isCaughtUp(summary, episodes)

      tr.classList.toggle(CAUGHT_UP_CLASS, caughtUp)

      const existing = titleTd.querySelector<HTMLElement>(`.${BOARD_BADGE_CLASS}`)
      if (caughtUp) {
        existing?.remove()
        return
      }

      const markup = progressBadgeMarkup(findLastWatched(episodes))
      if (existing) {
        existing.innerHTML = markup
        return
      }

      titleAnchor.style.marginRight = '8px'
      const badge = document.createElement('span')
      badge.className = `ext-badge ext-hover-shadow ${BOARD_BADGE_CLASS}`
      badge.innerHTML = markup
      // eslint-disable-next-line react-web-api/no-leaked-event-listener
      badge.addEventListener('click', () => openAnime1CategoryPage(categoryId))
      titleTd.appendChild(badge)
    })
  }, [episodeTrElements, data, categoryData, categoryRecords])

  return null
}
