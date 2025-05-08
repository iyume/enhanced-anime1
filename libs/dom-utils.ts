export const anime1StorageEvent = 'anime1-storage'

export type Anime1StorageEvent = Event & {
  key: string
  value: string | null
}

function newAnime1StorageEvent(key: string, value: string | null) {
  const event = new Event(anime1StorageEvent)
  // @ts-expect-error custom data
  event.key = key
  // @ts-expect-error custom data
  event.value = value
  return event
}

// Storage event is not fired in the current tab
// https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event
// So we need to manually fire the event when setItem or removeItem is called
// export function registerAnime1StorageEvent() {
//   const originSetItem = localStorage.setItem
//   localStorage.setItem = (key: string, value: string) => {
//     const event = newAnime1StorageEvent(key, value)
//     window.dispatchEvent(event)
//     console.log('setItem', key, value)
//     originSetItem(key, value)
//   }
//   const originRemoveItem = localStorage.removeItem
//   localStorage.removeItem = (key: string) => {
//     const event = newAnime1StorageEvent(key, null)
//     window.dispatchEvent(event)
//     console.log('removeItem', key)
//     originRemoveItem(key)
//   }
// }

export function registerAnime1StorageEvent() {
  const originalLocalStorage = window.localStorage

  // Define the proxy handler
  const localStorageProxyHandler = {
    setItem(target, key, value) { // For localStorage.setItem()
      const oldValue = target.getItem(key)
      const result = target.setItem(key, value) // Call original method

      const event = new CustomEvent(anime1StorageEvent, {
        detail: { key, newValue: value, oldValue },
      })
      window.dispatchEvent(event)
      console.log('setItem', key, value)
      return result
    },
    removeItem(target, key) { // For localStorage.removeItem()
      const oldValue = target.getItem(key)
      const result = target.removeItem(key) // Call original method

      const event = new CustomEvent(anime1StorageEvent, {
        detail: { key, newValue: null, oldValue },
      })
      window.dispatchEvent(event)
      return result
    },
    clear(target) { // For localStorage.clear()
      const result = target.clear() // Call original method

      const event = new CustomEvent(anime1StorageEvent, {
        detail: { key: null, newValue: null, oldValue: null }, // Or gather all old values if needed
      })
      window.dispatchEvent(event)
      return result
    },
    // Traps for direct property access
    get(target, key) {
      // Intercept direct reads if needed, otherwise reflect
      if (key === 'setItem')
        return (k, v) => this.setItem(target, k, v)
      if (key === 'getItem')
        return target.getItem.bind(target)
      if (key === 'removeItem')
        return k => this.removeItem(target, k)
      if (key === 'clear')
        return () => this.clear(target)
      if (key === 'key')
        return target.key.bind(target)
      if (key === 'length')
        return target.length

      // For other properties (direct key access)
      if (typeof target[key] === 'function') {
        return target[key].bind(target)
      }
      return target.getItem(key) // Or target[key] if you expect non-string properties (not standard for localStorage)
    },
    set(target, key, value) { // For localStorage.key = value or localStorage['key'] = value
      // Avoid trapping our own methods or standard properties
      if (['setItem', 'getItem', 'removeItem', 'clear', 'length', 'key'].includes(key)) {
        return Reflect.set(target, key, value)
      }

      const oldValue = target.getItem(key)
      target.setItem(key, value) // Use setItem to ensure consistency and string conversion

      const event = new CustomEvent(anime1StorageEvent, {
        detail: { key, newValue: value, oldValue },
      })
      window.dispatchEvent(event)
      return true // Indicate success
    },
    deleteProperty(target, key) { // For delete localStorage.key
      // Avoid trapping our own methods or standard properties
      if (['setItem', 'getItem', 'removeItem', 'clear', 'length', 'key'].includes(key)) {
        return Reflect.deleteProperty(target, key)
      }

      const oldValue = target.getItem(key)
      if (oldValue === null) { // Key doesn't exist
        return true // Or false if you want to indicate it wasn't there
      }
      target.removeItem(key) // Use removeItem for consistency

      const event = new CustomEvent(anime1StorageEvent, {
        detail: { key, newValue: null, oldValue },
      })
      window.dispatchEvent(event)
      return true // Indicate success
    },
  }

  const proxiedLocalStorage = new Proxy(originalLocalStorage, localStorageProxyHandler)
  console.log('proxiedLocalStorage', proxiedLocalStorage)

  try {
    // This is the tricky part. `window.localStorage` is often a non-configurable property.
    // You might not be able to reassign it directly.
    delete window.localStorage // This might fail or not be allowed
    Object.defineProperty(window, 'localStorage', {
      value: proxiedLocalStorage,
      writable: true,
      configurable: true,
    })
    console.warn('localStorage has been proxied.')
  }
  catch (e) {
    console.error('Failed to overwrite window.localStorage.', e)
  }
}
