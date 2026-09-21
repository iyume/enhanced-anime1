import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function launchWebAuthFlowAsync(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    browser.identity.launchWebAuthFlow(
      {
        url,
        interactive: true,
      },
      // Chrome will check if redirectUrl match https://<app-id>.chromiumapp.org/*
      (redirectUrl) => {
        if (!redirectUrl) {
          // User cancelled or server error
          reject(new Error('OAuth failed'))
          return
        }
        const url = new URL(redirectUrl)
        const code = url.searchParams.get('code')
        if (!code) {
          reject(new Error('Code not found in redirectUrl'))
          return
        }
        resolve(code)
      },
    )
  })
}

export function setIfChanged<T>(prev: T[], value: T[], setter: React.Dispatch<React.SetStateAction<T[]>>) {
  if (prev.length === value.length && prev.every((item, index) => item === value[index])) {
    return
  }
  setter(value)
}

export function injectCss(path: string) {
  const style = document.createElement('link')
  style.rel = 'stylesheet'
  style.href = path
  style.type = 'text/css'
  document.head.appendChild(style)
  return style
}

export function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  // Firefox only triggers the download for anchors attached to the document
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  // Give the browser a moment to start the download before releasing the blob
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function anime1CategoryUrl(categoryId: string) {
  return `https://anime1.me/?cat=${categoryId}`
}

export function anime1EpisodeUrl(episodeId: string) {
  return `https://anime1.me/?p=${episodeId}`
}

export function openAnime1CategoryPage(categoryId: string) {
  window.open(anime1CategoryUrl(categoryId), '_self')
}
