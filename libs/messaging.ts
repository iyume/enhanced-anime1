import { defineWindowMessaging } from '@webext-core/messaging/page'

interface ProtocolMap {
  getCategoryId: () => string | undefined
}

export const { sendMessage: sendMainWorldMessage, onMessage } = defineWindowMessaging<ProtocolMap>({
  namespace: 'main-world-injects',
  logger: console,
})
