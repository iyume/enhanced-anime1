import type { FC, PropsWithChildren } from 'react'
import { cn } from '@/libs/utils'

interface Props {
  className?: string
}

const TabsList: FC<PropsWithChildren<Props>> = ({ children, className }) => {
  return (
    <div className={cn(['h-9 items-center justify-center rounded-lg bg-(--muted) p-1 text-(--muted-text)', className])}>
      {/* grid w-full grid-cols-2 */}
      {children}
    </div>
  )
}

export default TabsList
