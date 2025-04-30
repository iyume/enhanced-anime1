import { queryClient } from '@/libs/query'
import { QueryClientProvider } from '@tanstack/react-query'
import { Anime1StateProvider } from './anime1-state-provider'

export function RootProviders({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <Anime1StateProvider>
        {children}
      </Anime1StateProvider>
    </QueryClientProvider>
  )
}
