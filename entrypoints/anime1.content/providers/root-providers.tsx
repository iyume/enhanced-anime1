import { queryClient } from '@/libs/query'
import { QueryClientProvider } from '@tanstack/react-query'
import { Anime1InfoProvider } from './anime1-info-provider'

export function RootProviders({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <Anime1InfoProvider value={null}>
        {children}
      </Anime1InfoProvider>
    </QueryClientProvider>
  )
}
