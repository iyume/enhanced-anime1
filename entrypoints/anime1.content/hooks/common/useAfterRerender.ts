/**
 *
 * @param callback The callback will be called after the first render and every re-render after that.
 */
export function useAfterRerender(callback: () => void) {
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    callback()
  })
}
