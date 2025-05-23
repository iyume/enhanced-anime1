import type { FC, PropsWithChildren } from 'react'
import type { TabsProps } from './_props'
import { TabsContext, TabsOptionsContext } from './_context'

const Tabs: FC<PropsWithChildren<TabsProps>> = ({ children, defaultValue, className }) => {
  const [currentValue, setCurrentValue] = useState(defaultValue)
  const ctx = useMemo(() => ({
    currentValue,
    setCurrentValue,
  }), [currentValue])
  const [options, setOptions] = useState<string[]>([])
  const optionsCtx = useMemo(() => ({
    options,
    setOptions,
  }), [options])

  // Handle default value when the TabsTrigger is mounted
  if (options.length > 0 && !currentValue) {
    setCurrentValue(options[0])
  }

  return (
    <div className={className}>
      <TabsContext value={ctx}>
        <TabsOptionsContext value={optionsCtx}>
          {children}
        </TabsOptionsContext>
      </TabsContext>
    </div>
  )
}

export default Tabs
