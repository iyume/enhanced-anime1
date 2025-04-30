import { useRendersCount } from './useRendersCount'

/**
 *
 * @param effect The effect to be executed after the first render and every re-render after that.
 * @param deps
 */
export const useUpdateEffect: typeof useEffect = (effect, deps) => {
  const renderCount = useRendersCount()

  useEffect(() => {
    if (renderCount > 1) {
      effect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
