// `keyBy` is enough: it pulls in lodash's `_root.js`, whose initialisation is what
// the CSP blocks. Nothing here touches eval or Function — the bundler does.
import { keyBy } from 'lodash'

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    console.log(keyBy([{ id: 'a' }, { id: 'b' }], 'id'))
  },
})
