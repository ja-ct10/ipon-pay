'use client'

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from 'react'
import type { WalletState } from '@/lib/types'
import {
  connectFreighter,
  disconnectFreighter,
  getFreighterAddress,
} from '@/lib/wallet'
import { fetchXLMBalance } from '@/lib/horizon'

// ─── Actions ─────────────────────────────────────────────────────────────────

type WalletAction =
  | { type: 'CONNECT'; address: string }
  | { type: 'DISCONNECT' }
  | { type: 'SET_BALANCE'; balance: string }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string }

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState: WalletState = {
  address: null,
  balance: null,
  isConnected: false,
  isLoading: false,
  error: null,
}

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'CONNECT':
      return {
        ...state,
        address: action.address,
        isConnected: true,
        isLoading: false,
        error: null,
      }
    case 'DISCONNECT':
      return {
        ...initialState,
      }
    case 'SET_BALANCE':
      return {
        ...state,
        balance: action.balance,
        isLoading: false,
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
        error: null,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false,
      }
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface WalletContextValue {
  state: WalletState
  dispatch: React.Dispatch<WalletAction>
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  refreshBalance: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState)

  // Session restore: check if Freighter still has the address on mount (Req 1.5)
  useEffect(() => {
    let cancelled = false

    async function restore() {
      const address = await getFreighterAddress()
      if (cancelled || !address) return

      dispatch({ type: 'CONNECT', address })

      // Set cookie so the proxy route guard allows access to protected routes
      if (typeof document !== 'undefined') {
        document.cookie = 'wallet_connected=1; path=/; SameSite=Lax'
      }

      try {
        const balance = await fetchXLMBalance(address)
        if (!cancelled) {
          dispatch({ type: 'SET_BALANCE', balance })
        }
      } catch {
        // Balance fetch failure on restore is non-fatal — silently ignore
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const connectWallet = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', isLoading: true })
    try {
      const address = await connectFreighter()
      dispatch({ type: 'CONNECT', address })
      const balance = await fetchXLMBalance(address)
      dispatch({ type: 'SET_BALANCE', balance })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect wallet.'
      dispatch({ type: 'SET_ERROR', error: message })
      throw err
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    disconnectFreighter()
    dispatch({ type: 'DISCONNECT' })
  }, [])

  const refreshBalance = useCallback(async () => {
    if (!state.address) return
    dispatch({ type: 'SET_LOADING', isLoading: true })
    try {
      const balance = await fetchXLMBalance(state.address)
      dispatch({ type: 'SET_BALANCE', balance })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch balance.'
      dispatch({ type: 'SET_ERROR', error: message })
    }
  }, [state.address])

  return (
    <WalletContext.Provider
      value={{ state, dispatch, connectWallet, disconnectWallet, refreshBalance }}
    >
      {children}
    </WalletContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return ctx
}
