import type { FC } from 'react'
import type { IAnime1Post } from '@/libs/anime1-site-parser'
import type { IAnime1RichEpisode } from '@/libs/query'
import { useAnime1EpisodeQuery } from '@/libs/query'
import { useVideoFirstPlay } from '../hooks/useVideoFirstPlay'
import { useAnime1State } from '../providers/anime1-state-provider'

function createNotification(video: IAnime1Post, episode: IAnime1RichEpisode) {
  const notification = document.createElement('div')
  notification.className = 'anime1-video-notification'

  // Styles are defined in `anime1-main.css`
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-progress">上次观看到 ${episode.displayCurrentTime}</div>
    </div>
  `
  video.videoElement.parentElement?.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = 'fadeOutNotification 0.3s ease forwards'
    setTimeout(() => {
      notification.remove()
    }, 300)
  }, 2500)
}

const Anime1VideoProgressResume: FC<{ video: IAnime1Post, episode: IAnime1RichEpisode }> = ({ video, episode }) => {
  const played = useVideoFirstPlay(video.videoElement)

  useEffect(() => {
    if (played && episode.currentTime > 10) {
      video.videoElement.currentTime = episode.currentTime - 5
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
    state.posts.map((video) => {
      const episode = data?.[video.id]
      if (!episode)
        return null
      return (
        <Anime1VideoProgressResume key={video.id} video={video} episode={episode} />
      )
    })
  )
}
