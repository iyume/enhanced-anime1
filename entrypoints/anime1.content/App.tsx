import { getAnime1PageType } from '@/libs/anime1-site-parser'
import { RootProviders } from './providers/root-providers'

export default function App() {
  const hostname = window.location.hostname
  if (hostname !== 'anime1.me') {
    return null
  }

  const pageType = getAnime1PageType()

  return (
    <RootProviders>
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
