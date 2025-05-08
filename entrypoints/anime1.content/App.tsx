import { getAnime1PageType } from '@/libs/anime1-site-parser'
import { Anime1HomeUIInject } from './components/anime1-home-ui-inject'
import { Anime1VideoWorkers } from './components/anime1-video-worker'
import { Drawer } from './components/drawer'
import { useAfterRerender } from './hooks/common/useAfterRerender'
import { RootProviders } from './providers/root-providers'

export default function App() {
  useAfterRerender(() => {
    console.log('App re-render')
  })

  return (
    <RootProviders>
      <AppLayout />
    </RootProviders>
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

      <Drawer position="left" height="50%" className="w-64">
        <p style={{ color: 'black' }}>TodoApp</p>
        <button type="button">
          测试
        </button>
        <button type="button">
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
