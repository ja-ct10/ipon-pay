/**
 * src/lib/wallet.ts
 *
 * StellarWalletsKit integration layer.
 * Provides a unified API for all four supported wallet providers:
 * Freighter, xBull, Lobstr, and Albedo.
 *
 * Legacy Freighter exports are kept as @deprecated wrappers so existing
 * callers (soroban-client.ts etc.) continue to compile without changes.
 */

import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk'
import { Networks } from '@creit.tech/stellar-wallets-kit/types'
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter'
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull'
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr'
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo'

// Re-export Networks so callers can import it from this file
export { Networks }

// ── Singleton initialisation ─────────────────────────────────────────────────
// StellarWalletsKit v2.5.0 uses a static class pattern — init() configures
// all static methods; there is no instance to hold.

StellarWalletsKit.init({
  network: Networks.TESTNET,
  modules: [
    new FreighterModule(),
    new xBullModule(),
    new LobstrModule(),
    new AlbedoModule(),
  ],
})

/**
 * The kit singleton — exported so other modules can call kit methods directly
 * if needed (e.g. kit.setWallet, kit.getAddress).
 * In v2.5.0 the kit is a static class, so `kit` is just a reference to the class itself.
 */
export const kit = StellarWalletsKit

// ── Core connection functions ─────────────────────────────────────────────────

/**
 * Opens the built-in WalletSelector (authModal) so the user can pick a wallet.
 * Returns the connected address string on success.
 * Throws if the user cancels or the wallet fails to connect.
 */
export async function openWalletSelector(): Promise<string> {
  const { address } = await StellarWalletsKit.authModal()
  return address
}

/**
 * Sets the active wallet by ID and retrieves the user's public key address.
 * Returns the address string on success, or '' if getAddress fails.
 */
export async function connectWallet(walletId: string): Promise<string> {
  StellarWalletsKit.setWallet(walletId)
  try {
    const { address } = await StellarWalletsKit.getAddress()
    return address ?? ''
  } catch {
    return ''
  }
}

/**
 * Retrieves the public key from the currently active wallet module.
 * Returns null if no wallet is set or if address retrieval fails.
 */
export async function getConnectedAddress(): Promise<string | null> {
  try {
    const { address } = await StellarWalletsKit.getAddress()
    return address || null
  } catch {
    return null
  }
}

// ── Signing ───────────────────────────────────────────────────────────────────

/**
 * Signs a transaction XDR with the currently active wallet module.
 * Throws a classifiable error on failure — callers should use classifyWalletError().
 */
export async function signWithKit(
  xdr: string,
  networkPassphrase: string,
): Promise<string> {
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase,
  })
  return signedTxXdr
}

// ── Error handling helpers ────────────────────────────────────────────────────

/**
 * Classifies any caught wallet error into one of four categories.
 * Never throws — callers can always branch safely on the returned string.
 */
export function classifyWalletError(
  err: unknown,
): 'not_found' | 'rejected' | 'insufficient_balance' | 'unknown' {
  try {
    const message =
      err instanceof Error
        ? err.message.toLowerCase()
        : typeof err === 'string'
          ? err.toLowerCase()
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message).toLowerCase()
            : ''

    if (
      message.includes('not found') ||
      message.includes('not installed') ||
      message.includes('not detected')
    ) {
      return 'not_found'
    }

    if (
      message.includes('cancelled') ||
      message.includes('canceled') ||
      message.includes('rejected') ||
      message.includes('denied') ||
      message.includes('user declined')
    ) {
      return 'rejected'
    }

    if (
      message.includes('underfunded') ||
      message.includes('insufficient')
    ) {
      return 'insufficient_balance'
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Pure function: returns true if balance is insufficient to cover amount + reserve.
 * Used to disable the "Send Contribution" button before submission.
 */
export function hasInsufficientFunds(
  balance: number,
  amount: number,
  reserve: number,
): boolean {
  return balance < amount + reserve
}

/**
 * Pure function: constructs a Stellar Expert explorer link for a transaction hash.
 */
export function stellarExpertLink(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`
}

// ── Legacy / deprecated Freighter exports ────────────────────────────────────
// These are kept as thin wrappers so soroban-client.ts and any other existing
// callers continue to compile without changes during the migration window.

import {
  isConnected,
  getAddress as freighterGetAddress,
  requestAccess,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api'

/**
 * @deprecated Use openWalletSelector() + connectWallet() instead.
 */
export async function connectFreighter(): Promise<string> {
  const connResult = await isConnected()
  if (!connResult.isConnected) {
    throw new Error('Freighter not installed')
  }
  const result = await requestAccess()
  if (result.error) {
    throw new Error('Wallet connection cancelled.')
  }
  if (typeof document !== 'undefined') {
    document.cookie = 'wallet_connected=1; path=/; SameSite=Lax'
  }
  return result.address
}

/**
 * @deprecated Disconnection is now handled via WalletContext.disconnectWallet().
 */
export function disconnectFreighter(): void {
  if (typeof document !== 'undefined') {
    document.cookie =
      'wallet_connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
  }
}

/**
 * @deprecated Use getConnectedAddress() instead.
 */
export async function getFreighterAddress(): Promise<string | null> {
  try {
    const connResult = await isConnected()
    if (!connResult.isConnected) return null
    const result = await freighterGetAddress()
    return result.error ? null : (result.address || null)
  } catch {
    return null
  }
}

/**
 * @deprecated Use signWithKit() instead.
 */
export async function signWithFreighter(
  txXDR: string,
  networkPassphrase: string,
): Promise<string> {
  const result = await freighterSignTransaction(txXDR, { networkPassphrase })
  if (result.error) {
    throw new Error('Transaction cancelled by user.')
  }
  return result.signedTxXdr
}
