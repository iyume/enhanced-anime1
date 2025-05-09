import type React from 'react'

import { cn } from '@/libs/utils'
import { useState } from 'react'

interface HoverDrawerProps {
  children: React.ReactNode
  width?: number
  icon: React.ReactNode
}

export function Drawer({ children, width = 320, icon }: HoverDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [side, setSide] = useState<'left' | 'right'>('left')

  const translateValue = useMemo(() => {
    if (side === 'left') {
      return isOpen ? 0 : -width
    }
    else {
      return isOpen ? 0 : width
    }
  }, [isOpen, side, width])

  return (
    <>
      <div
        className={cn(
          'fixed top-1/4 -translate-y-1/2 transition-opacity duration-150 z-30 cursor-pointer',
          side === 'left' ? 'left-0' : 'right-0',
          isOpen ? 'opacity-0' : 'opacity-100',
        )}
        onClick={() => setIsOpen(true)}
      >
        {icon}
      </div>
      <div
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-40 bg-(--background) transition-transform',
          side === 'left' ? 'left-0' : 'right-0',
        )}
        onMouseLeave={() => setIsOpen(false)}
        style={
          {
            transform: `translateX(${translateValue}px)`,
            width: `${width}px`,
          }
        }
      >
        <div className="h-screen">
          {children}
        </div>
      </div>
    </>
  )
}
