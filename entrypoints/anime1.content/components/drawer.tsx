import { cn } from '@/libs/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface DrawerProps {
  /**
   * The content to display inside the drawer when expanded
   */
  children: React.ReactNode
  /**
   * The position of the drawer on the screen
   * @default "right"
   */
  position?: 'left' | 'right'
  /**
   * The height of the drawer
   * @default "300px"
   */
  height?: string
  /**
   * The width of the drawer when expanded
   * @default "300px"
   */
  expandedWidth?: string
  /**
   * The width of the drawer when collapsed
   * @default "30px"
   */
  collapsedWidth?: string
  /**
   * Additional CSS classes to apply to the drawer
   */
  className?: string
}

export function Drawer({
  children,
  position = 'right',
  height = '300px',
  expandedWidth = '300px',
  collapsedWidth = '30px',
  className,
}: DrawerProps) {
  const [isHovered, setIsHovered] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Handle clicks outside the drawer to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsHovered(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Calculate how much to translate the drawer
  const translateValue
    = position === 'left'
      ? isHovered
        ? '0'
        : `calc(-100% + ${collapsedWidth})`
      : isHovered
        ? '0'
        : `calc(100% - ${collapsedWidth})`

  return (
    <div
      ref={drawerRef}
      className={cn(
        'fixed z-50 transition-transform duration-300 ease-in-out',
        position === 'left' ? 'left-0' : 'right-0',
        'top-1/2 -translate-y-1/2',
        className,
      )}
      style={{
        height,
        width: expandedWidth,
        transform: `translateX(${translateValue})`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'h-full w-full rounded-md shadow-lg overflow-hidden flex',
          position === 'left' ? 'rounded-l-none' : 'rounded-r-none',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        )}
      >
        {position === 'right' && (
          <div className="flex items-center justify-center" style={{ width: collapsedWidth }}>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </div>
        )}

        <div className="flex-1 overflow-hidden">{children}</div>

        {position === 'left' && (
          <div className="flex items-center justify-center" style={{ width: collapsedWidth }}>
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </div>
        )}
      </div>
    </div>
  )
}
