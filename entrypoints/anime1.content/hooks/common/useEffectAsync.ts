import type { DependencyList } from 'react'

export function useEffectAsync(effect: () => Promise<void>, deps?: DependencyList) {
  useEffect(() => {
    effect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
