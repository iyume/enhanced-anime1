import type { FC } from 'react'
import _ from 'lodash'
import { useAnime1EpisodeQuery } from '@/libs/query'
import { openAnime1CategoryPage, setIfChanged } from '@/libs/utils'
import { useEffectOnce } from '../hooks/common/useEffectOnce'

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

// Parse `XXX(05)` and `1-12`
function parseEpisodeFromTableCell(td: HTMLTableCellElement): number | null {
  let match = td.textContent?.match(/\((\d+)\)/)
  if (match) {
    return Number.parseInt(match[1])
  }
  match = td.textContent?.match(/^(\d+)-(\d+)\+?/)
  if (match) {
    return Number.parseInt(match[2])
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
    if (!episodeTrElements.length || !data) {
      return
    }
    console.log('Process', episodeTrElements)
    episodeTrElements.forEach((tr) => {
      const tdList = tr.querySelectorAll('td')
      if (tdList.length < 2) {
        return
      }
      const [titleTd, episodeTd, ..._rest] = tdList
      if (titleTd.children.length > 1) {
        // Already processed
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
      // 页面上只显示最新一集，当最新一集看过则置灰，再展示最后看的进度
      const episodes = Object.values(data).filter(ep => ep.categoryId === categoryId)
      const lastWatchEpisode = _.maxBy(episodes, x => x.updatedAt)
      if (!lastWatchEpisode) {
        return
      }

      const makeTableRowGray = () => {
        // 这里是幂等的，暂时不用处理
        tr.style.color = '#9ca3af'
        titleAnchor.style.color = '#9ca3af'
        tr.style.textDecoration = 'line-through'
      }
      // 如果当前集（最新一集或者最后一集）已经看完，则置灰
      const cellEpisodeNumber = parseEpisodeFromTableCell(episodeTd)
      if (cellEpisodeNumber !== null) {
        const cellEpisode = episodes.find(ep => ep.episodeNumber === cellEpisodeNumber)
        if (cellEpisode && cellEpisode.isFinished) {
          makeTableRowGray()
          return
        }
      }
      if (episodeTd.textContent?.includes('劇場版')) {
        const episode = episodes[0]
        if (episode && episode.isFinished) {
          makeTableRowGray()
          return
        }
      }

      titleAnchor.style.marginRight = '8px'
      const progressBadge = document.createElement('span')
      progressBadge.className = 'ext-badge ext-hover-shadow'
      progressBadge.innerHTML = `
        <span style="font-size: 0.8rem;margin-right: 4px;">▶ </span>
        <span>上次观看至${lastWatchEpisode.displayEpisodeNumber !== '剧场版' ? ` ${lastWatchEpisode.displayEpisodeNumber} 话` : ''} ${lastWatchEpisode.displayCurrentTime}</span>
      `
      const handleClick = () => {
        openAnime1CategoryPage(categoryId)
      }
      // There is no need to removeEventListener because anime1 cache the object
      // eslint-disable-next-line react-web-api/no-leaked-event-listener
      progressBadge.addEventListener('click', handleClick)

      titleTd.appendChild(progressBadge)
    })
  }, [episodeTrElements, data])

  return null
}
