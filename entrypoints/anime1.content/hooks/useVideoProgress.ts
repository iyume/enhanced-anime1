import { useEffectOnce } from './common/useEffectOnce'

export function useVideoProgress(videoElement: HTMLVideoElement) {
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffectOnce(() => {
    const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime)
    const handleDurationChange = () => setDuration(videoElement.duration)

    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('durationchange', handleDurationChange)

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('durationchange', handleDurationChange)
    }
  })

  return useMemo(() => ({
    duration,
    currentTime,
  }), [duration, currentTime])
}
