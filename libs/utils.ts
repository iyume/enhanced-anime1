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
