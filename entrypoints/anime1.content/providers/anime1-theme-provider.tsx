import type { Anime1StorageEvent } from '@/libs/dom-utils'
import type { FC, PropsWithChildren } from 'react'
import { anime1StorageEvent } from '@/libs/dom-utils'
import { createContext, memo, use } from 'react'
import { useEffectOnce } from '../hooks/common/useEffectOnce'

const Context = createContext<'white' | 'dark' | 'auto' | null>(null)

// auto_darkmode: 0 | 1
// darkmode: 0 | 1
function getTheme() {
  const autoDarkmode = localStorage.getItem('auto_darkmode')
  if (autoDarkmode === '1') {
    return 'auto'
  }
  const darkmode = localStorage.getItem('darkmode')
  if (darkmode === '0') {
    return 'white'
  }
  else if (darkmode === '1') {
    return 'dark'
  }
  return 'auto'
}

export const Anime1ThemeProvider: FC<PropsWithChildren> = memo(({ children }) => {
  const [theme, setTheme] = useState<'white' | 'dark' | 'auto'>('auto')

  console.log('Anime1ThemeProvider', theme)

  const handleStorageChange = useCallback((event: Event) => {
    const e = event as Anime1StorageEvent
    if (!e.key)
      return
    if (!['auto_darkmode', 'darkmode'].includes(e.key))
      return
    setTheme(getTheme())
  }, [])

  useEffectOnce(() => {
    setTheme(getTheme())
    window.addEventListener(anime1StorageEvent, handleStorageChange)
    return () => {
      window.removeEventListener(anime1StorageEvent, handleStorageChange)
    }
  })

  return (
    <Context value={theme}>
      {children}
    </Context>
  )
})

// eslint-disable-next-line react-refresh/only-export-components
export function useAnime1Theme() {
  const context = use(Context)
  if (!context) {
    throw new Error('useBangumiAuth must be used within a BangumiAuthProvider')
  }
  return context
}
