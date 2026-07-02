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
  openWalletSelector,
  getConnectedAddress,
  classifyWalletError,
} from '@/lib/wallet'
import { fetchXLMBalance } from '@/lib/horizon'

// ─── Actions ─────────────────────────────────────────────────────────────────

type WalletAction =
  | { type: 'CONNECT'; address: string }
  | { type: 'DISCONNECT' }
  | { type: 'SET_BALANCE'; balance: string }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_TX_STATUS'; status: 'pending' | 'success' | 'fail' | null }
  | { type: 'SET_TX_HASH'; hash: string }
  | { type: 'SET_CONTRACT_TX_HASH'; hash: string }
  | { type: 'SET_WALLET_TYPE'; walletType: string }

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState: WalletState = {
  address: null,
  balance: null,
  isConnected: false,
  isLoading: false,
  error: null,
  walletType: null,
  txStatus: null,
  lastTxHash: null,
  contractTxHash: null,
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
    case 'SET_TX_STATUS':
      return {
        ...state,
        txStatus: action.status,
      }
    case 'SET_TX_HASH':
      return {
        ...state,
        lastTxHash: action.hash,
      }
    case 'SET_CONTRACT_TX_HASH':
      return {
        ...state,
        contractTxHash: action.hash,
      }
    case 'SET_WALLET_TYPE':
      return {
        ...state,
        walletType: action.walletType,
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
  openSelector: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

const WALLET_TYPE_KEY = 'iponpay_wallet_type'

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState)

  // Task 3.4 — Session restore on mount using localStorage wallet type
  useEffect(() => {
    let cancelled = false

    async function restore() {
      const walletType = localStorage.getItem(WALLET_TYPE_KEY)
      if (!walletType) return

      // Don't call kit.setWallet() — the kit's internal state persists via the
      // browser extension. Just try to get the address from whatever wallet is active.
      const address = await getConnectedAddress()
      if (!address) {
        // Wallet no longer available or not connected — clean up silently
        localStorage.removeItem(WALLET_TYPE_KEY)
        return
      }

      if (cancelled) return

      dispatch({ type: 'CONNECT', address })
      dispatch({ type: 'SET_WALLET_TYPE', walletType })

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

  // Task 3.3 — connectWallet now opens the kit authModal picker
  const connectWallet = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', isLoading: true })
    try {
      // openWalletSelector() shows the built-in WalletSelector modal and returns
      // the connected address once the user picks a wallet and authorises access
      const address = await openWalletSelector()
      dispatch({ type: 'CONNECT', address })
      // After authModal, the kit has the wallet set internally.
      // We store 'connected' as a flag — on restore we use getConnectedAddress()
      // which works without needing to re-set a specific wallet module.
      dispatch({ type: 'SET_WALLET_TYPE', walletType: 'connected' })
      localStorage.setItem(WALLET_TYPE_KEY, 'connected')
      if (typeof document !== 'undefined') {
        document.cookie = 'wallet_connected=1; path=/; SameSite=Lax'
      }
      const balance = await fetchXLMBalance(address)
      dispatch({ type: 'SET_BALANCE', balance })
    } catch (err: unknown) {
      const category = classifyWalletError(err)
      const messages: Record<string, string> = {
        not_found: 'Wallet not found. Please install it to continue.',
        rejected: 'Transaction rejected. You cancelled the signing request.',
        insufficient_balance:
          'Insufficient balance — you need at least 11 XLM (10 XLM contribution + 1 XLM reserve).',
        unknown: 'Failed to connect wallet.',
      }
      dispatch({ type: 'SET_ERROR', error: messages[category] })
      throw err
    }
  }, [])

  // Task 3.3 — disconnectWallet removes localStorage key and clears cookie
  const disconnectWallet = useCallback(() => {
    localStorage.removeItem(WALLET_TYPE_KEY)
    if (typeof document !== 'undefined') {
      document.cookie =
        'wallet_connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
    }
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

  // Task 3.3 — openSelector: convenience wrapper for components that just want
  // to show the wallet picker without going through the full connectWallet flow
  const openSelector = useCallback(() => {
    openWalletSelector().catch(() => {
      // Errors are surfaced via the connectWallet error path; swallow here
    })
  }, [])

  // Auto-refresh balance every 30s when connected (Issue 2: real-time wallet balance)
  useEffect(() => {
    if (!state.isConnected || !state.address) return
    const interval = setInterval(async () => {
      try {
        const balance = await fetchXLMBalance(state.address!)
        dispatch({ type: 'SET_BALANCE', balance })
      } catch { /* silent — do not surface polling errors to the user */ }
    }, 30_000)
    return () => clearInterval(interval)
  }, [state.isConnected, state.address])

  return (
    <WalletContext.Provider
      value={{ state, dispatch, connectWallet, disconnectWallet, refreshBalance, openSelector }}
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
