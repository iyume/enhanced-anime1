import { resolve } from 'node:path'
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],

  webExt: {
    // Windows:
    // chromiumProfile: `${resolve('.wxt/chrome-data')}`,
    // keepProfileChanges: true,

    // Mac/Linux:
    // chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],

    binaries: {
      edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    },
  },

  manifestVersion: 3,
  manifest: {
    name: 'Anime1.me Tracker',
    description:
      'Automatically tracks anime1.me viewing history and syncs watch progress to your bgm.tv (Bangumi) account.',
    permissions: ['storage', 'activeTab', 'scripting'],
  },
})
