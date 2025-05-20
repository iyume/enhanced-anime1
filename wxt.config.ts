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
      'Automatically tracks anime1.me viewing history and syncs watch progress to your bgm.tv (Bangumi) account.',
    permissions: ['storage', 'activeTab', 'scripting', 'identity'],
    host_permissions: [
      'https://bangumi-token-exchanger.iyumelive.workers.dev/*',
    ],
    web_accessible_resources: [
      {
        resources: ['inject.js'],
        matches: [
          '*://anime1.me/*',
        ],
      },
    ],
  },
})
