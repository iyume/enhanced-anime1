import { onMessage } from '@/libs/messaging'

export default defineUnlistedScript(() => {
  onMessage('getCategoryId', () => {
    return (window as any).dataLayer?.[0]?.categoryID
  })
})
