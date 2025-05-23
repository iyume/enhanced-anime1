import type { FC, PropsWithChildren } from 'react'
import { cn } from '@/libs/utils'
import { useTabsContext } from './_context'

interface Props {
  className?: string
  value: string
}

const TabsContent: FC<PropsWithChildren<Props>> = ({ children, className, value }) => {
  const { currentValue } = useTabsContext()
  return (
    <div className={cn([
      'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      className,
      currentValue !== value && 'hidden',
    ])}
    >
      {children}
    </div>
  )
}

export default TabsContent
