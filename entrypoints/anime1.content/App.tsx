import { getAnime1PageType } from '@/libs/anime1-site-parser'
import { Anime1CategoryControls } from './components/anime1-category-controls'
import { Anime1HomeUIInject } from './components/anime1-home-ui-inject'
import { Anime1VideoProgressResumes } from './components/anime1-video-progress-resume'
import { Anime1VideoWorkers } from './components/anime1-video-worker'
import { FloatingWidget } from './components/FloatingWidget'
import { useAfterRerender } from './hooks/common/useAfterRerender'
import { useAnime1Theme } from './providers/anime1-theme-provider'
import { RootProviders } from './providers/root-providers'
import { ShadowRootProvider } from './providers/shadow-root-provider'

export default function App({ el }: { el: HTMLDivElement }) {
  useAfterRerender(() => {
    console.log('App re-render')
  })

  const [shadowElements, _] = useState<{
    shadowRoot: ShadowRoot
    htmlElement: HTMLHtmlElement
  }>(() => {
    const shadowRoot = el.getRootNode() as ShadowRoot
    const htmlElement = shadowRoot.firstChild as HTMLHtmlElement
    return { shadowRoot, htmlElement }
  })
  console.log('App root', shadowElements)

  return (
    <ShadowRootProvider state={shadowElements}>
      <RootProviders>
        <AppLayout />
      </RootProviders>
    </ShadowRootProvider>
  )
}

function AppLayout() {
  const pageType = getAnime1PageType()
  const anime1Theme = useAnime1Theme()

  useEffect(() => {
    // Dynamically inject css variables
    const css = `
    :root {
      /* Anime1 primary color */
      --primary: ${anime1Theme === 'white' ? '#77cc6d' : '#ce327f'};

      --background: ${anime1Theme === 'white' ? '#f5f5f5' : '#1a1a1a'};
      --text: ${anime1Theme === 'white' ? '#1a1a1a' : '#f5f5f5'};
      --border: ${anime1Theme === 'white' ? '#eaeaea' : '#282828'};
    }
    `
    // Reuse previous style tag
    const id = 'injected-anime1-theme-css'
    let styleTag = document.getElementById(id) as HTMLStyleElement
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = id
      document.head.appendChild(styleTag)
    }
    styleTag.textContent = css
  }, [anime1Theme])

  return (
    <>
      {
        (pageType === 'category' || pageType === 'episode')
        && (
          <>
            <Anime1VideoWorkers />
            <Anime1VideoProgressResumes />
          </>
        )
      }
      { pageType === 'category' && <Anime1CategoryControls /> }
      {
        pageType === 'home'
        && <Anime1HomeUIInject />
      }

      <FloatingWidget>
        <div className="p-4">
          <button type="button" className="text-(--text)">
            测试
          </button>
          <button type="button" className="text-(--text)">
            登录 Bangumi
          </button>
          <p>
            页面类型：
            {pageType}
          </p>
        </div>
      </FloatingWidget>
    </>
  )
}
