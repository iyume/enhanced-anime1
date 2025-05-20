export type Anime1PageType = 'home' | 'episode' | 'category' | 'unknown'

let cachedPageType: Anime1PageType | null = null

export function getAnime1PageType(): Anime1PageType {
  if (cachedPageType) {
    return cachedPageType
  }
  const path = window.location.pathname
  const search = window.location.search
  let pageType: Anime1PageType = 'unknown'
  if (path === '/' && !search) {
    pageType = 'home'
  }
  else if (path.startsWith('/category/')) {
    pageType = 'category'
  }
  else if (/^\/\d+$/.test(path)) {
    pageType = 'episode'
  }
  cachedPageType = pageType
  return pageType
}

export interface IAnime1CategoryInfo {
  title: string
  episodes: IAnime1Video[]
}

export interface IAnime1Video {
  id: string
  categoryId: string
  title: string
  element: HTMLVideoElement
}

interface Context {
  categoryId?: string
}

export function parseAnime1CategoryPage(ctx?: Context): IAnime1CategoryInfo | null {
  const title = document.querySelector('.page-header h1.page-title')?.textContent

  const episodes: IAnime1Video[] = []

  document.querySelectorAll('article.post').forEach((article) => {
    const episode = parseAnime1Article(article, ctx)
    if (!episode) {
      return
    }
    episodes.push(episode)
  })

  if (!title || episodes.length === 0) {
    console.error('Failed to parse category page:', { title, episodes })
    return null
  }

  return { title, episodes }
}

export function parseAnime1ArticlePage(ctx?: Context): IAnime1Video | null {
  const article = document.querySelector('article.post')
  if (!article) {
    console.error('Failed to parse article page')
    return null
  }
  return parseAnime1Article(article, ctx)
}

function parseAnime1Article(article: Element, ctx?: Context): IAnime1Video | null {
  const episodeId = article.id.replace('post-', '')
  if (!episodeId) {
    console.error('Episode ID not found for article:', article)
    return null
  }
  const categoryId = ctx?.categoryId ?? Array.from(article.classList).find(className => className.startsWith('category-'))?.replace('category-', '')
  if (!categoryId) {
    console.error('Category ID not found for article:', article)
    return null
  }
  const episodeTitleElement = article.querySelector('.entry-title')
  const episodeTitle = episodeTitleElement?.textContent || 'Unknown Episode'

  // Parse video.js info
  const videoPlayer = article.querySelector('.vjscontainer .video-js')
  if (!videoPlayer) {
    console.error('Video player not found for episode:', episodeTitle)
    return null
  }
  // const isPlaying = !videoPlayer.classList.contains('vjs-paused')

  // Get H5 player
  const videoElement = videoPlayer.querySelector('video')
  if (!videoElement) {
    console.error('Video element not found for episode:', episodeTitle)
    return null
  }

  return {
    id: episodeId,
    categoryId,
    title: episodeTitle,
    element: videoElement,
  }
}
