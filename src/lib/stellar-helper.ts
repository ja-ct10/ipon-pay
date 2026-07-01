/**
 * Stellar Helper - Blockchain Logic with Stellar SDK
 * Adapted to use @stellar/stellar-sdk v16 with @stellar/freighter-api for signing.
 */

import * as StellarSdk from '@stellar/stellar-sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssetBalance {
  code: string;
  issuer: string;
  balance: string;
}

export interface AccountBalances {
  xlm: string;
  assets: AssetBalance[];
}

export interface PaymentParams {
  from: string;
  to: string;
  amount: string;
  memo?: string;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
}

export interface RecentTransaction {
  id: string;
  type: string;
  amount?: string;
  asset?: string;
  from?: string;
  to?: string;
  createdAt: string;
  hash: string;
}

// ---------------------------------------------------------------------------
// Standalone helpers (used by property tests and contribution flow)
// ---------------------------------------------------------------------------

/**
 * Builds an unsigned Stellar payment transaction.
 *
 * @param source       - Stellar public key of the sender
 * @param destination  - Stellar public key of the recipient
 * @param amount       - Amount in XLM (e.g. "10.0000000")
 * @param network      - 'testnet' | 'mainnet' (defaults to testnet)
 * @returns An unsigned {@link StellarSdk.Transaction}
 */
export async function buildPaymentTransaction(
  source: string,
  destination: string,
  amount: string,
  network: 'testnet' | 'mainnet' = 'testnet',
): Promise<StellarSdk.Transaction> {
  const horizonUrl =
    network === 'testnet'
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org';

  const networkPassphrase =
    network === 'testnet'
      ? StellarSdk.Networks.TESTNET
      : StellarSdk.Networks.PUBLIC;

  const server = new StellarSdk.Horizon.Server(horizonUrl);
  const account = await server.loadAccount(source);

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: StellarSdk.Asset.native(),
        amount,
      }),
    )
    .setTimeout(180)
    .build();

  return transaction;
}

// ---------------------------------------------------------------------------
// StellarHelper class (mirrors original structure, adapted for IponPay)
// ---------------------------------------------------------------------------

export class StellarHelper {
  private server: StellarSdk.Horizon.Server;
  private networkPassphrase: string;
  private network: 'testnet' | 'mainnet';
  private publicKey: string | null = null;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    const horizonUrl =
      network === 'testnet'
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org';

    this.server = new StellarSdk.Horizon.Server(horizonUrl);
    this.networkPassphrase =
      network === 'testnet'
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC;
    this.network = network;
  }

  // -------------------------------------------------------------------------
  // Account helpers
  // -------------------------------------------------------------------------

  async getBalance(publicKey: string): Promise<AccountBalances> {
    const account = await this.server.loadAccount(publicKey);

    const xlmBalance = account.balances.find(
      (b): b is StellarSdk.Horizon.HorizonApi.BalanceLineNative =>
        b.asset_type === 'native',
    );

    const assets: AssetBalance[] = account.balances
      .filter(
        (b): b is StellarSdk.Horizon.HorizonApi.BalanceLineAsset =>
          b.asset_type === 'credit_alphanum4' ||
          b.asset_type === 'credit_alphanum12',
      )
      .map((b) => ({
        code: b.asset_code,
        issuer: b.asset_issuer,
        balance: b.balance,
      }));

    return {
      xlm: xlmBalance ? xlmBalance.balance : '0',
      assets,
    };
  }

  // -------------------------------------------------------------------------
  // Transaction helpers
  // -------------------------------------------------------------------------

  /**
   * Build an unsigned payment transaction for the given parameters.
   * Delegates to the standalone {@link buildPaymentTransaction}.
   */
  async buildPayment(params: PaymentParams): Promise<StellarSdk.Transaction> {
    return buildPaymentTransaction(
      params.from,
      params.to,
      params.amount,
      this.network,
    );
  }

  /**
   * Submit a signed transaction XDR to the Horizon network.
   */
  async submitSignedTransaction(signedTxXdr: string): Promise<TransactionResult> {
    const tx = StellarSdk.TransactionBuilder.fromXDR(
      signedTxXdr,
      this.networkPassphrase,
    );

    const result = await this.server.submitTransaction(
      tx as StellarSdk.Transaction,
    );

    return {
      hash: result.hash,
      success: result.successful,
    };
  }

  // -------------------------------------------------------------------------
  // Transaction history
  // -------------------------------------------------------------------------

  async getRecentTransactions(
    publicKey: string,
    limit: number = 10,
  ): Promise<RecentTransaction[]> {
    const payments = await this.server
      .payments()
      .forAccount(publicKey)
      .order('desc')
      .limit(limit)
      .call();

    return payments.records.map(
      (record: StellarSdk.Horizon.ServerApi.OperationRecord): RecentTransaction => {
        // Narrow to fields common to all operation records, then pick typed fields safely
        const payment = record as StellarSdk.Horizon.ServerApi.PaymentOperationRecord;
        return {
          id: record.id,
          type: record.type,
          amount: 'amount' in record ? String(record.amount) : undefined,
          asset:
            'asset_type' in record && record.asset_type === 'native'
              ? 'XLM'
              : 'asset_code' in record
                ? String(record.asset_code)
                : undefined,
          from: 'from' in payment ? payment.from : undefined,
          to: 'to' in payment ? payment.to : undefined,
          createdAt: record.created_at,
          hash: record.transaction_hash,
        };
      },
    );
  }

  // -------------------------------------------------------------------------
  // Utility helpers
  // -------------------------------------------------------------------------

  getExplorerLink(
    hash: string,
    type: 'tx' | 'account' = 'tx',
  ): string {
    const net =
      this.networkPassphrase === StellarSdk.Networks.TESTNET
        ? 'testnet'
        : 'public';
    return `https://stellar.expert/explorer/${net}/${type}/${hash}`;
  }

  formatAddress(
    address: string,
    startChars: number = 4,
    endChars: number = 4,
  ): string {
    if (address.length <= startChars + endChars) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  disconnect(): boolean {
    this.publicKey = null;
    return true;
  }
}

export const stellar = new StellarHelper('testnet');
