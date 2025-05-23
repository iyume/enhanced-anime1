/**
 * Like useEffectOnce, but runs before the component mounts.
 * "Setup" stands for vue's setup function.
 * DO NOT update state in this function, as it violates the rule of react:
 * The rendering must be pure.
 * @param func The function to run once.
 */
export function useSetupOnce(func: () => any) {
  const ran = useRef(false)
  if (!ran.current)
    func()
  ran.current = true
}
