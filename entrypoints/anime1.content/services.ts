import { getBangumiService } from '@/services/bangumi/BangumiService'
import { getProxyService } from '@/services/ProxyService'

export const proxyService = getProxyService()
export const bangumiService = getBangumiService()
