import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],

  vite: _ => ({
    plugins: [tailwindcss()],
  }),

  webExt: {
    // Windows:
    chromiumProfile: `${resolve('.wxt/chrome-data')}`,
    keepProfileChanges: true,

    // Mac/Linux:
    // chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],

    binaries: {
      edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    },
  },

  manifestVersion: 3,
  manifest: {
    name: 'Enhanced Anime1',
    description:
      'Browser extension that adds useful features for anime1.me site.',
    homepage_url: 'https://github.com/iyume/enhanced-anime1',
    permissions: ['storage', 'identity'],
    host_permissions: [
      'https://bangumi-token-exchanger.iyumelive.workers.dev/*',
    ],
    web_accessible_resources: [
      {
        resources: ['inject.js', 'assets/anime1-main.css', 'icons/*.png'],
        matches: [
          '*://anime1.me/*',
        ],
      },
    ],
    browser_specific_settings: {
      gecko: {
        id: 'iyumelive@gmail.com', // UUID or email for Firefox
      },
    },
  },
})
