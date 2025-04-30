export function useRendersCount(): number {
  return ++useRef(0).current
}
