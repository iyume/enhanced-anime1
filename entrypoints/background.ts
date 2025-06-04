import { registerBangumiService } from '@/services/bangumi/BangumiService'
import { registerProxyService } from '@/services/ProxyService'

export default defineBackground(() => {
  registerProxyService()
  registerBangumiService()
  console.log('background script loaded')
})
