import type { FC, PropsWithChildren } from 'react'
import { createContext, memo, use } from 'react'
import { useEffectOnce } from '../hooks/common/useEffectOnce'
import { bangumiService } from '../services'

const Context = createContext<ReturnType<typeof useAuth> | null>(null)

function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffectOnce(() => {
    const fn = async () => {
      const loggedIn = await bangumiService.isLoggedIn()
      setIsLoggedIn(loggedIn)
    }
    fn()
  })

  async function login() {
    await bangumiService.login()
    setIsLoggedIn(true)
  }

  async function logout() {
    await bangumiService.logout()
    setIsLoggedIn(false)
  }

  return {
    isLoggedIn,
    setIsLoggedIn,
    login,
    logout,
  }
}

export const BangumiAuthProvider: FC<PropsWithChildren> = memo(({ children }) => {
  const auth = useAuth()
  return (
    <Context value={auth}>
      {children}
    </Context>
  )
})

// eslint-disable-next-line react-refresh/only-export-components
export function useBangumiAuth() {
  const context = use(Context)
  if (!context) {
    throw new Error('useBangumiAuth must be used within a BangumiAuthProvider')
  }
  return context
}
