import type { EffectCallback } from 'react'

/**
 * Like react-use, but handles async effects.
 * @param effect The effect callback to run once.
 */
export function useEffectOnce(effect: EffectCallback | (() => Promise<void>)) {
  useEffect(() => {
    const cleanup = effect()
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
