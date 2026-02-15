import { getAnime1PageType } from '@/libs/anime1-site-parser'
import { Anime1CategoryBangumiCard } from './components/Anime1CategoryBangumiCard'
import { Anime1CategoryControls } from './components/anime1-category-controls'
import { Anime1HomeUIInject } from './components/anime1-home-ui-inject'
import { Anime1VideoProgressResumes } from './components/anime1-video-progress-resume'
import { Anime1VideoStatusUI } from './components/anime1-video-status-ui'
import { Anime1VideoWorkers } from './components/anime1-video-worker'
import { FloatingWidget } from './components/FloatingWidget'
import FloatWidgetContent from './components/FloatingWidgetContent'
import { Anime1Icon } from './components/icon/Anime1Icon'
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
    // Dynamically inject css variables into main world
    const css = `
    :root {
      /* Anime1 primary color */
      --primary: ${anime1Theme === 'white' ? '#77cc6d' : '#ce327f'};

      --background: ${anime1Theme === 'white' ? '#f5f5f5' : '#1a1a1a'};
      --text: ${anime1Theme === 'white' ? '#3d3d3d' : '#e4e6eb'};
      --border: ${anime1Theme === 'white' ? '#e4e4e7' : '#27272a'};
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
            <Anime1VideoStatusUI />
          </>
        )
      }
      { pageType === 'category' && (
        <>
          <Anime1CategoryBangumiCard />
          <Anime1CategoryControls />
        </>
      ) }
      {
        pageType === 'home'
        && <Anime1HomeUIInject />
      }

      <FloatingWidget icon={<Anime1Icon size="24px" color="#e4e6eb" />}>
        <FloatWidgetContent />
      </FloatingWidget>
    </>
  )
}
