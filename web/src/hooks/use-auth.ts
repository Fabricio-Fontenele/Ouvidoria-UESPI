import { useContext } from 'react'

import { AuthContext } from '../contexts/auth-context'

export function useAuth() {
  const auth = useContext(AuthContext)

  if (auth === null) {
    throw new Error('AuthProvider is required to use authentication.')
  }

  return auth
}
