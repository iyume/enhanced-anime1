import { formatProgressDateTime } from './progress-transfer'

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const minutes = Math.floor((now - timestamp) / (1000 * 60))
  if (minutes < 1) {
    return '刚刚'
  }
  if (minutes < 60) {
    return `${minutes} 分钟前`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} 小时前`
  }
  const days = Math.floor(hours / 24)
  if (days < 30) {
    return `${days} 天前`
  }
  return formatProgressDateTime(timestamp)
}
