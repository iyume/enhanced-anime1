import { registerProxyService } from '@/libs/ProxyService'

export default defineBackground(() => {
  registerProxyService()
  console.log('background script loaded')
})
