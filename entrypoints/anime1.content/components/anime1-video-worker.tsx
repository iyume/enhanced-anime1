import type { IAnime1Video } from '@/libs/anime1-site-parser'
import type { StorageAnime1Episode } from '@/libs/storage'
import type { FC } from 'react'
import { useAnime1EpisodeBatchUpdate } from '@/libs/query'
import { throttle } from 'lodash'
import { memo } from 'react'
import { useAfterRerender } from '../hooks/common/useAfterRerender'
import { useUpdateEffect } from '../hooks/common/useUpdateEffect'
import { useVideoProgress } from '../hooks/useVideoProgress'
import { useAnime1State } from '../providers/anime1-state-provider'

interface _Progress {
  currentTime: number
  duration: number
}

export const Anime1VideoWorker: FC<{ video: IAnime1Video, onProgressUpdate: (id: string, state: _Progress) => void }> = ({ video, onProgressUpdate }) => {
  const videoState = useVideoProgress(video.element)
  // Only update when user interact with the video (not mounted)
  useUpdateEffect(() => {
    onProgressUpdate(video.id, videoState)
  }, [videoState, onProgressUpdate])

  return null
}

export const Anime1VideoWorkers: FC = memo(() => {
  const state = useAnime1State()
  const { mutate } = useAnime1EpisodeBatchUpdate()
  const [videosProgress, setVideosProgress] = useState<Record<string, { currentTime: number, duration: number }>>({})

  useAfterRerender(() => {
    console.log('trigger after re-render for workers', videosProgress)
  })
  const trottledSyncAnime1Episodes = useMemo(() => {
    return throttle((episodes: StorageAnime1Episode[]) => {
      console.log('[Storage] Sync anime1Episodes', new Date().toLocaleString())
      mutate(episodes)
    }, 1000, { leading: false, trailing: true })
  }, [mutate])

  useEffect(() => {
    if (!state.videos.length || !Object.keys(videosProgress).length) {
      return
    }
    const episodes: StorageAnime1Episode[] = []
    state.videos.forEach((video) => {
      const progress = videosProgress[video.id]
      if (!progress)
        return null
      const updatedAt = Date.now()
      episodes.push({
        id: video.id,
        categoryId: video.categoryId,
        title: video.title,
        currentTime: progress.currentTime,
        duration: progress.duration,
        updatedAt,
      })
    })
    trottledSyncAnime1Episodes(episodes)
  }, [state.videos, videosProgress, trottledSyncAnime1Episodes])

  const handleProgressChange = useCallback((videoId: string, state: _Progress) => {
    setVideosProgress((prev) => {
      return {
        ...prev,
        [videoId]: state,
      }
    })
  }, [])

  return (
    state.videos.map(video => (
      <Anime1VideoWorker
        key={video.id}
        video={video}
        onProgressUpdate={handleProgressChange}
      />
    ))
  )
})
