import type { FC } from 'react'
import { useAnime1EpisodeQuery } from '@/libs/query'
import { useAnime1State } from '../providers/anime1-state-provider'

export const Anime1VideoStatusUI: FC = () => {
  const { posts } = useAnime1State()
  const { data } = useAnime1EpisodeQuery()
  // Controls only process once
  const processed = useRef(false)

  useEffect(() => {
    if (!data || !posts.length || processed.current)
      return
    processed.current = true
    posts.forEach((post) => {
      const record = data[post.id]
      if (!record)
        return
      const header = post.articleElement.querySelector('.entry-header')
      if (!header)
        return
      const badges = document.createElement('div')
      badges.className = 'ext-badge-list'
      badges.style.marginTop = '8px'
      badges.innerHTML = `
        <span class="ext-badge">
          <span>上次观看至 ${record.displayCurrentTime}</span>
        </span>
        <span class="ext-badge">
          <svg style="margin-right: 2px" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history-icon lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
          <span>${new Date(record.updatedAt).toLocaleString()}</span>
        </span>
      `
      header.appendChild(badges)
    })
  }, [posts, data])

  return null
}
