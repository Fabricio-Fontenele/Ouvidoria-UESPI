import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { AuthService } from '../application/auth/auth-service'
import type {
  AuthSession,
  EmailVerificationCredentials,
  PasswordResetCodeCredentials,
  ResetPasswordCredentials,
  SignInCredentials,
  SignUpCredentials,
} from '../application/auth/auth-types'
import { SignIn } from '../application/auth/sign-in'
import { SignUp } from '../application/auth/sign-up'
import { clearChatMessages, clearPendingDraft } from '../infrastructure/guara-chat/guara-chat-storage'
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
        await signUpUseCase.execute(credentials)
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

  const confirmEmailVerification = useCallback(
    async (credentials: EmailVerificationCredentials) => {
      setError(null)
      setIsLoading(true)

      try {
        const nextSession = await service.confirmEmailVerification(credentials)
        setSession(nextSession)
        return true
      } catch (confirmationError) {
        setSession(null)
        setError(resolveAuthError(confirmationError))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [service],
  )

  const resendEmailVerificationCode = useCallback(
    async (email: string) => {
      setError(null)
      setIsLoading(true)

      try {
        await service.resendEmailVerificationCode(email)
        return true
      } catch (resendError) {
        setError(resolveAuthError(resendError))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [service],
  )

  const requestPasswordReset = useCallback(
    async (email: string) => {
      setError(null)
      setIsLoading(true)

      try {
        await service.requestPasswordReset(email)
        return true
      } catch (requestError) {
        setError(resolveAuthError(requestError))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [service],
  )

  const confirmPasswordResetCode = useCallback(
    async (credentials: PasswordResetCodeCredentials) => {
      setError(null)
      setIsLoading(true)

      try {
        await service.confirmPasswordResetCode(credentials)
        return true
      } catch (confirmationError) {
        setError(resolveAuthError(confirmationError))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [service],
  )

  const resetPassword = useCallback(
    async (credentials: ResetPasswordCredentials) => {
      setError(null)
      setIsLoading(true)

      try {
        const nextSession = await service.resetPassword(credentials)
        setSession(nextSession)
        return true
      } catch (resetError) {
        setError(resolveAuthError(resetError))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [service],
  )

  const signOut = useCallback(async () => {
    await service.signOut()
    clearChatMessages()
    clearPendingDraft()
    setSession(null)
    setError(null)
  }, [service])

  const value = useMemo(
    () => ({
      confirmPasswordResetCode,
      confirmEmailVerification,
      error,
      isAuthenticated: session !== null,
      isLoading,
      requestPasswordReset,
      resendEmailVerificationCode,
      resetPassword,
      session,
      signIn,
      signUp,
      signOut,
      user: session?.user ?? null,
    }),
    [
      confirmEmailVerification,
      confirmPasswordResetCode,
      error,
      isLoading,
      requestPasswordReset,
      resendEmailVerificationCode,
      resetPassword,
      session,
      signIn,
      signUp,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
