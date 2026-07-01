import {
  isConnected,
  getAddress,
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api'

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

export function disconnectFreighter(): void {
  if (typeof document !== 'undefined') {
    document.cookie =
      'wallet_connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
  }
}

export async function getFreighterAddress(): Promise<string | null> {
  try {
    const connResult = await isConnected()
    if (!connResult.isConnected) return null
    const result = await getAddress()
    return result.error ? null : (result.address || null)
  } catch {
    return null
  }
}

export async function signWithFreighter(
  txXDR: string,
  networkPassphrase: string,
): Promise<string> {
  const result = await signTransaction(txXDR, { networkPassphrase })
  if (result.error) {
    throw new Error('Transaction cancelled by user.')
  }
  return result.signedTxXdr
}
