import type { FC, PropsWithChildren } from 'react'
import { createContext, memo, use } from 'react'
import { useEffectOnce } from '../hooks/common/useEffectOnce'
import { useShadowRoot } from './shadow-root-provider'

const Context = createContext<'white' | 'dark' | null>(null)

function isDisplayNone(el: Element) {
  const style = el.getAttribute('style')
  if (!style) {
    return false
  }
  return /display\s*:\s*none/i.test(style)
}

function getTheme(el: Element | null = null) {
  if (!el) {
    el = document.querySelector('#darkmodebtn')
  }
  if (!el) {
    console.warn('darkmodebtn not found')
    return 'white'
  }
  return isDisplayNone(el) ? 'dark' : 'white'
}

function useAnime1ThemeObserver(callback: (theme: 'white' | 'dark') => void) {
  useEffectOnce(() => {
    const darkmodebtn = document.querySelector('#darkmodebtn')
    if (!darkmodebtn) {
      console.warn('darkmodebtn not found')
      return
    }
    const mutation = new MutationObserver(() => {
      const theme = getTheme(darkmodebtn)
      callback(theme)
    })
    mutation.observe(darkmodebtn!, {
      attributes: true,
      attributeFilter: ['style'],
    })
  })
}

export const Anime1ThemeProvider: FC<PropsWithChildren> = memo(({ children }) => {
  const [theme, setTheme] = useState<'white' | 'dark'>(() => {
    return getTheme()
  })
  const shadowRoot = useShadowRoot()
  useAnime1ThemeObserver(theme => setTheme(theme))

  console.log('Anime1ThemeProvider', theme)

  useEffect(() => {
    const htmlElement = shadowRoot.htmlElement
    if (theme === 'dark') {
      htmlElement.classList.add('dark')
    }
    else {
      htmlElement.classList.remove('dark')
    }
  }, [shadowRoot.htmlElement, theme])

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
