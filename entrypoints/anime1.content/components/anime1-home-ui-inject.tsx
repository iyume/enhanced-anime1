import type { FC } from 'react'
import { useAnime1EpisodeQuery } from '@/libs/query'
import { setIfChanged } from '@/libs/utils'
import _ from 'lodash'
import { useEffectOnce } from '../hooks/common/useEffectOnce'
import { useTraceUpdate } from '../hooks/common/useTraceUpdate'

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

// Parse XXX(05)
function parseEpisodeFromTableCell(td: HTMLTableCellElement): number | null {
  const match = td.textContent?.match(/\((\d+)\)/)
  if (match) {
    return Number.parseInt(match[1])
  }
  return null
}

export const Anime1HomeUIInject: FC = () => {
  const { data } = useAnime1EpisodeQuery()
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
    console.log('Process', episodeTrElements)
    episodeTrElements.forEach((tr) => {
      const tdList = tr.querySelectorAll('td')
      if (tdList.length < 2) {
        return
      }
      const [titleTd, episodeTd, ..._rest] = tdList
      if (titleTd.children.length > 1) {
        return
      }
      const titleAnchor = titleTd.querySelector('a')
      if (!titleAnchor) {
        return
      }
      const categoryId = parseCategoryIdFromUrl(titleAnchor.href)
      if (!categoryId) {
        return
      }
      const episodes = data && Object.values(data).filter(episode => episode.categoryId === categoryId)
      if (!episodes || !episodes.length) {
        return
      }
      const lastEpisode = _.maxBy(episodes, e => e.episodeNumber)!

      // Gray the text if the episode is seen
      const cellEpisode = parseEpisodeFromTableCell(episodeTd)
      if (lastEpisode.episodeNumber !== null && cellEpisode !== null) {
        if (cellEpisode <= lastEpisode.episodeNumber) {
          tr.style.color = '#9ca3af'
          titleAnchor.style.color = '#9ca3af'
          tr.style.textDecoration = 'line-through'
        }
      }

      const progressBadge = document.createElement('span')
      progressBadge.dataset.isAnime1Tracker = 'true'
      progressBadge.style = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 8px;
        padding: 4px 8px;
        font-size: 0.8rem;
        font-weight: 500;
        border-radius: 12px;
        background-color: #6366f1;
        color: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
      `

      const iconSpan = document.createElement('span')
      iconSpan.textContent = '▶ '
      iconSpan.style = `
        font-size: 0.7rem;
        margin-right: 4px;
      `
      const textSpan = document.createElement('span')
      textSpan.textContent = `${lastEpisode.displayEpisodeNumber} (${lastEpisode.progressPercent}%)`

      progressBadge.appendChild(iconSpan)
      progressBadge.appendChild(textSpan)
      titleTd.appendChild(progressBadge)
    })
  }, [episodeTrElements, data])

  return null
}
