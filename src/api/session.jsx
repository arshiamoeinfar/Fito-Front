import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from './client.js'
import { SessionContext, sessionState } from './session.js'

export function SessionProvider({ children }) {
  const [state, setState] = useState({
    status: 'loading',
    account: null,
    error: null,
  })

  const refresh = useCallback(async () => {
    try {
      const account = await api('/api/v1/me')
      setState(sessionState(account, null))
      return account
    } catch (error) {
      setState(sessionState(null, error))

      if (error instanceof ApiError && error.status === 401) {
        return null
      }

      throw error
    }
  }, [])

  useEffect(() => {
    let active = true

    api('/api/v1/me').then(
      (account) => {
        if (active) {
          setState(sessionState(account, null))
        }
      },
      (error) => {
        if (active) {
          setState(sessionState(null, error))
        }
      },
    )

    return () => {
      active = false
    }
  }, [])

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh])

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}
