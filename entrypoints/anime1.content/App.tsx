import { getAnime1PageType } from '@/libs/anime1-site-parser'
import { Anime1HomeUIInject } from './components/anime1-home-ui-inject'
import { Anime1VideoWorkers } from './components/anime1-video-worker'
import { useAfterRerender } from './hooks/common/useAfterRerender'
import { RootProviders } from './providers/root-providers'

export default function App() {
  const pageType = getAnime1PageType()

  useAfterRerender(() => {
    console.log('App re-render')
  })

  return (
    <RootProviders>
      {
        (pageType === 'category' || pageType === 'episode')
        && (<Anime1VideoWorkers />)
      }
      {
        pageType === 'home'
        && (<Anime1HomeUIInject />)
      }
      <div
        className="fixed top-0 right-0 w-[300px] h-[300px] bg-cyan-500 z-[999999]"
      >
        <p style={{ color: 'black' }}>TodoApp</p>
        <p>
          页面类型：
          {pageType}
        </p>
      </div>
    </RootProviders>
  )
}
