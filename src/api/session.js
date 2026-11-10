import { createContext, useContext } from 'react'

export const SessionContext = createContext(null)

export function useSession() {
  const value = useContext(SessionContext)

  if (value === null) {
    throw new Error('useSession must be used within SessionProvider')
  }

  return value
}

export function sessionState(account, error) {
  if (error instanceof Error && error.status === 401) {
    return { status: 'guest', account: null, error: null }
  }

  if (error) {
    return { status: 'error', account: null, error }
  }

  return { status: 'authenticated', account, error: null }
}
