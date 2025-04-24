export default defineContentScript({
  matches: ['*://*.google.com/*'],
  async main() {
    console.log('Hello content.')
  },
})
