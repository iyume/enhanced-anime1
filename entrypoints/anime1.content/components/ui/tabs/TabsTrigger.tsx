import type { FC, PropsWithChildren } from 'react'
import { useEffectOnce } from '@/entrypoints/anime1.content/hooks/common/useEffectOnce'
import { cn } from '@/libs/utils'
import { useTabsContext, useTabsOptionsContext } from './_context'

interface Props {
  className?: string
  value: string
}

const TabsTrigger: FC<PropsWithChildren<Props>> = ({ children, className, value }) => {
  const { currentValue, setCurrentValue } = useTabsContext()
  const { options, setOptions } = useTabsOptionsContext()

  useEffectOnce(() => {
    if (options.includes(value)) {
      // TODO: support dynamic value or unmount?
      console.error('TabsTrigger: value already exists in options')
      return
    }
    setOptions((prev) => {
      return [...prev, value]
    })
  })

  return (
    <button
      className={cn(['inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-(--background) data-[state=active]:text-(--text) data-[state=active]:shadow', className])}
      type="button"
      data-state={currentValue === value ? 'active' : 'inactive'}
      onClick={() => {
        setCurrentValue(value)
      }}
    >
      {children}
    </button>
  )
}

export default TabsTrigger
