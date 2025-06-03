import ReactDOM from 'react-dom/client'
import { injectCss } from '@/libs/utils'
import App from './App'
import './assets/tailwind.css'

// eslint-disable-next-line react-refresh/only-export-components
export default defineContentScript({
  matches: [
    '*://anime1.me/*',
    // '*://*.bgm.tv/*',
    // '*://*.bangumi.tv/*',
    // '*://*.chii.in/*',
  ],

  // DOMContentLoaded -> wait max 200ms for window.onload -> fire
  // https://stackoverflow.com/questions/33248629/when-does-a-run-at-document-idle-content-script-run
  runAt: 'document_idle',

  cssInjectionMode: 'ui',

  async main(ctx) {
    await injectScript('/inject.js', { keepInDom: true })
    injectCss(browser.runtime.getURL('/assets/anime1-main.css'))

    const ui = await createShadowRootUi(ctx, {
      name: 'enhanced-anime1',
      position: 'inline',
      anchor: 'html',

      onMount: (container) => {
        const hostname = window.location.hostname
        if (hostname !== 'anime1.me') {
          return
        }

        // registerAnime1StorageEvent()

        const wrapper = document.createElement('div')
        wrapper.id = 'app-wrapper'
        container.append(wrapper)

        const root = ReactDOM.createRoot(wrapper)
        root.render(<App el={wrapper} />)
        return { root, wrapper }
      },

      onRemove: (root) => {
        root?.root.unmount()
        root?.wrapper.remove()
      },
    })
    ui.mount()

    console.log('Anime1.me tracker content script loaded')
  },
})
