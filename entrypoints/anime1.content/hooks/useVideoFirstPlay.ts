import { useEffectOnce } from './common/useEffectOnce'

/**
 * A custom hook to track when the videostart playing firstly.
 */
export function useVideoFirstPlay(videoElement: HTMLVideoElement) {
  const [played, setPlayed] = useState(false)

  useEffectOnce(() => {
    const handlePlay = () => played || setPlayed(true)

    videoElement.addEventListener('play', handlePlay)

    return () => {
      videoElement.removeEventListener('play', handlePlay)
    }
  })

  return played
}
