import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { AuthService } from '../application/auth/auth-service'
import type { AuthSession, SignInCredentials, SignUpCredentials } from '../application/auth/auth-types'
import { SignIn } from '../application/auth/sign-in'
import { SignUp } from '../application/auth/sign-up'
import { AuthContext } from './auth-context'

function resolveAuthError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Não foi possível concluir a operação agora. Tente novamente.'
}

export function AuthProvider({ children, service }: { children: ReactNode; service: AuthService }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const signInUseCase = useMemo(() => new SignIn(service), [service])
  const signUpUseCase = useMemo(() => new SignUp(service), [service])

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const storedSession = await service.getSession()

      if (isMounted) {
        setSession(storedSession)
        setIsLoading(false)
      }
    }

    void loadSession()

    return () => {
      isMounted = false
    }
  }, [service])

  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      setError(null)
      setIsLoading(true)

      try {
        const nextSession = await signInUseCase.execute(credentials)
        setSession(nextSession)
        return true
      } catch (signInError) {
        setSession(null)
        setError(resolveAuthError(signInError))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [signInUseCase],
  )

  const signUp = useCallback(
    async (credentials: SignUpCredentials) => {
      setError(null)
      setIsLoading(true)

      try {
        const nextSession = await signUpUseCase.execute(credentials)
        setSession(nextSession)
        return true
      } catch (signUpError) {
        setSession(null)
        setError(resolveAuthError(signUpError))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [signUpUseCase],
  )

  const signOut = useCallback(async () => {
    await service.signOut()
    setSession(null)
    setError(null)
  }, [service])

  const value = useMemo(
    () => ({
      error,
      isAuthenticated: session !== null,
      isLoading,
      session,
      signIn,
      signUp,
      signOut,
      user: session?.user ?? null,
    }),
    [error, isLoading, session, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
