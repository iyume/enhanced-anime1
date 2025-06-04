import { queryClient } from '@/libs/query'
import { QueryClientProvider } from '@tanstack/react-query'
import { Anime1StateProvider } from './anime1-state-provider'
import { Anime1ThemeProvider } from './anime1-theme-provider'

export function RootProviders({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <Anime1StateProvider>
        <Anime1ThemeProvider>
          {children}
        </Anime1ThemeProvider>
      </Anime1StateProvider>
    </QueryClientProvider>
  )
}
