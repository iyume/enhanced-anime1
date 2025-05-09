import { getAnime1PageType } from '@/libs/anime1-site-parser'
import { Anime1HomeUIInject } from './components/anime1-home-ui-inject'
import { Anime1VideoWorkers } from './components/anime1-video-worker'
import { Drawer } from './components/drawer'
import { DrawerIcon } from './components/drawer-icon'
import { useAfterRerender } from './hooks/common/useAfterRerender'
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
  return (
    <>
      {
        (pageType === 'category' || pageType === 'episode')
        && <Anime1VideoWorkers />
      }
      {
        pageType === 'home'
        && <Anime1HomeUIInject />
      }

      <Drawer width={300} icon={<DrawerIcon />}>
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
      </Drawer>
    </>
  )
}
