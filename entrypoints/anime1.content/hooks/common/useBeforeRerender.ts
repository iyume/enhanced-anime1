export function useBeforeRender(callback: () => void) {
  const isFirstRender = useRef(true)

  if (!isFirstRender.current) {
    // This runs during component function execution,
    // before React actually updates the DOM
    callback()
  }

  if (isFirstRender.current) {
    isFirstRender.current = false
  }
}
