import { registerProxyService } from '@/services/ProxyService'
import { registerBangumiService } from '@/services/bangumi/BangumiService'

export default defineBackground(() => {
  registerProxyService()
  registerBangumiService()
  console.log('background script loaded')
})
