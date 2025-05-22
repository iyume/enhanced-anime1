import type { JSX } from 'react'
import { storageWidgetPosition } from '@/libs/storage'
import { MessageSquare } from 'lucide-react'
import { AnimatePresence, motion, useMotionValue } from 'motion/react'
import { useEffectOnce } from '../hooks/common/useEffectOnce'
import { useUpdateEffect } from '../hooks/common/useUpdateEffect'

export const FloatingWidget: React.FC<React.PropsWithChildren<{ icon?: JSX.Element }>> = ({ children, icon }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [drawerPosition, setDrawerPosition] = useState<'left' | 'right'>('right')
  const constraintsRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  // Motion values for drag
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Scale on hover
  const scale = useMotionValue(1)

  useEffectOnce(async () => {
    const savedPosition = await storageWidgetPosition.getValue()
    // Avoid exceeding the window bounds
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const widgetSize = 56
    const xPos = Math.min(Math.max(savedPosition.x, 0), windowWidth - widgetSize)
    const yPos = Math.min(Math.max(savedPosition.y, 0), windowHeight - widgetSize)
    x.set(xPos)
    y.set(yPos)
  })

  useUpdateEffect(() => {
    const savePosition = async () => {
      const newPosition = { x: x.get(), y: y.get() }
      await storageWidgetPosition.setValue(newPosition)
    }

    if (!isDragging) {
      savePosition()
    }
  }, [isDragging])

  const updateDrawerPosition = () => {
    const xPos = x.get()
    const windowWidth = window.innerWidth
    const threshold = windowWidth / 2

    if (xPos < threshold) {
      setDrawerPosition('left')
    }
    else {
      setDrawerPosition('right')
    }
  }

  const handleWidgetClick = () => {
    if (!isDragging) {
      updateDrawerPosition()
      setIsOpen(true)
    }
  }

  const closeDrawer = () => {
    setIsOpen(false)
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    updateDrawerPosition()
    // Use a small timeout to reset the dragging state
    // This ensures the click handler won't fire immediately after drag
    setTimeout(() => {
      setIsDragging(false)
    }, 100)
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" ref={constraintsRef}>
      {/* Overlay when drawer is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 pointer-events-auto z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-0 bottom-0 w-80 bg-(--background) shadow-lg pointer-events-auto z-50 overflow-y-auto"
            initial={{
              x: drawerPosition === 'left' ? '-100%' : '100%',
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: drawerPosition === 'left' ? '-100%' : '100%',
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              [drawerPosition]: 0,
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Widget */}
      <motion.div
        className="fixed flex items-center justify-center w-14 h-14 rounded-full bg-(--primary) text-white shadow-lg cursor-grab active:cursor-grabbing pointer-events-auto z-40"
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.1}
        style={{ x, y, scale }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleWidgetClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {icon ?? <MessageSquare className="w-6 h-6" />}
      </motion.div>
    </div>
  )
}
