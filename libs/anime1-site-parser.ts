export function getAnime1PageType(): 'home' | 'episode' | 'category' | 'unknown' {
  const path = window.location.pathname
  const search = window.location.search
  if (path === '/' && !search) {
    return 'home'
  }
  else if (path.startsWith('/category/')) {
    return 'category'
  }
  else if (/^\/\d+$/.test(path)) {
    return 'episode'
  }
  return 'unknown'
}

interface IAnime1CategoryInfo {
  title: string
  episodes: IAnime1Video[]
}

interface IAnime1Video {
  id: string
  categoryId: string
  title: string
  episode: number | null
  element: HTMLVideoElement
}

export function parseAnime1CategoryPage(): IAnime1CategoryInfo {
  const title = document.querySelector('.page-header h1.page-title')?.textContent || 'Unable to parse title'

  const episodes: IAnime1Video[] = []

  document.querySelectorAll('article.post').forEach((article) => {
    const episode = parseAnime1Article(article)
    if (!episode) {
      return
    }
    episodes.push(episode)
  })

  return { title, episodes }
}

export function parseAnime1ArticlePage(): IAnime1Video | null {
  const article = document.querySelector('article.post')
  if (!article) {
    console.error('Article not found on page')
    return null
  }
  return parseAnime1Article(article)
}

function parseAnime1Article(article: Element): IAnime1Video | null {
  const episodeId = article.id.replace('post-', '')
  if (!episodeId) {
    console.error('Episode ID not found for article:', article)
    return null
  }
  const categoryId = article.id.replace('category-', '')
  if (!categoryId) {
    console.error('Category ID not found for article:', article)
    return null
  }
  const episodeTitleElement = article.querySelector('.entry-title a')
  const episodeTitle = episodeTitleElement?.textContent || 'Unknown Episode'

  // Parse episode from title `title [01]`
  // 有可能是剧场版 https://anime1.me/category/2024%e5%b9%b4%e6%98%a5%e5%ad%a3/%e5%8a%87%e5%a0%b4%e7%b8%bd%e9%9b%86%e7%af%87-%e5%ad%a4%e7%8d%a8%e6%90%96%e6%bb%be-re
  const episodeMatch = episodeTitle.match(/\[(\d+)\]/)
  const episodeNumber = episodeMatch ? Number.parseInt(episodeMatch[1]) : null

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
    episode: episodeNumber,
    element: videoElement,
  }
}
