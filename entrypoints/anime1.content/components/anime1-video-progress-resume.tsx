import type { IAnime1Video } from '@/libs/anime1-site-parser'
import type { IAnime1RichEpisode } from '@/libs/query'
import type { FC } from 'react'
import { useAnime1EpisodeQuery } from '@/libs/query'
import { useVideoFirstPlay } from '../hooks/useVideoFirstPlay'
import { useAnime1State } from '../providers/anime1-state-provider'

function createNotification(video: IAnime1Video, episode: IAnime1RichEpisode) {
  // Create container for notification
  const notification = document.createElement('div')
  notification.className = 'anime1-video-notification'

  // Create inner content with icon and text container for better layout
  notification.innerHTML = `
    <div class="notification-icon">
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </div>
    <div class="notification-content">
      <div class="notification-title">${episode.title}</div>
      <div class="notification-info">Episode ${episode.displayEpisodeNumber} · ${episode.progressPercent}% complete</div>
    </div>
  `

  // Add styles
  const style = document.createElement('style')
  style.textContent = `
    .anime1-video-notification {
      position: absolute;
      bottom: 36px;
      left: 16px;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      transform: translateY(-10px);
      opacity: 0;
      animation: fadeInNotification 0.3s ease forwards;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      pointer-events: none;
      border-left: 3px solid var(--primary);
      max-width: 320px;
    }
    
    .notification-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      color: var(--primary);
    }
    
    .notification-content {
      display: flex;
      flex-direction: column;
    }
    
    .notification-title {
      font-weight: 600;
      margin-bottom: 2px;
      font-size: 14px;
    }
    
    .notification-info {
      font-size: 12px;
      opacity: 0.8;
    }
    
    @keyframes fadeInNotification {
      0% {
        opacity: 0;
        transform: translateY(-10px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fadeOutNotification {
      0% {
        opacity: 1;
        transform: translateY(0);
      }
      100% {
        opacity: 0;
        transform: translateY(-10px);
      }
    }
  `

  document.head.appendChild(style)
  video.element.parentElement?.appendChild(notification)

  // Animate out and remove after delay
  setTimeout(() => {
    notification.style.animation = 'fadeOutNotification 0.3s ease forwards'
    setTimeout(() => {
      notification.remove()
      style.remove()
    }, 300)
  }, 2500)
}

const Anime1VideoProgressResume: FC<{ video: IAnime1Video, episode: IAnime1RichEpisode }> = ({ video, episode }) => {
  const played = useVideoFirstPlay(video.element)
  useEffect(() => {
    if (played) {
      video.element.currentTime = episode.currentTime
      // Show notification around video element
      createNotification(video, episode)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [played])

  return null
}

export const Anime1VideoProgressResumes: FC = () => {
  const { data } = useAnime1EpisodeQuery()
  const state = useAnime1State()

  return (
    state.videos.map((video) => {
      const episode = data?.[video.id]
      if (!episode)
        return null
      return (
        <Anime1VideoProgressResume key={video.id} video={video} episode={episode} />
      )
    })
  )
}
