import { createContext, use } from 'react'

export const TabsContext = createContext<{
  currentValue?: string
  setCurrentValue: (value: string) => void
} | null>(null)

export function useTabsContext() {
  const context = use(TabsContext)
  if (!context) {
    throw new Error('useTabsContext must be used within a <Tabs /> component')
  }
  return context
}

export const TabsOptionsContext = createContext<{
  options: string[]
  setOptions: (options: (prev: string[]) => string[]) => void
} | null>(null)

export function useTabsOptionsContext() {
  const context = use(TabsOptionsContext)
  if (!context) {
    throw new Error('useTabsOptionsContext must be used within a <Tabs /> component')
  }
  return context
}
