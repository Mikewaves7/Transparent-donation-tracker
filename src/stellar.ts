import { Horizon, Networks, TransactionBuilder, Operation, Asset } from '@stellar/stellar-sdk'
import { getAddress, isConnected, signTransaction } from '@stellar/freighter-api'

export const NETWORK = 'TESTNET' as const
export const PASSPHRASE = Networks.TESTNET
export const server = new Horizon.Server('https://horizon-testnet.stellar.org')

export async function connectWallet() {
  const connected = await isConnected()
  if (!connected.isConnected) throw new Error('Freighter wallet is not available. Install the Freighter browser extension.')
  const account = await getAddress()
  if (!account.address) throw new Error('No Stellar account was selected in Freighter.')
  return account.address
}

export async function getBalance(address: string) {
  const account = await server.loadAccount(address)
  const native = account.balances.find((b) => b.asset_type === 'native')
  return native?.balance ?? '0'
}

export async function sendDonation(sender: string, destination: string, amount: string, note: string) {
  if (!/^G[A-Z2-7]{55}$/.test(destination)) throw new Error('Enter a valid Stellar public address.')
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > 100000000) throw new Error('Enter a valid donation amount.')
  const source = await server.loadAccount(sender)
  const fee = await server.fetchBaseFee()
  const tx = new TransactionBuilder(source, { fee: String(fee), networkPassphrase: PASSPHRASE })
    .addOperation(Operation.payment({ destination, asset: Asset.native(), amount: Number(amount).toFixed(7).replace(/0+$/, '').replace(/\.$/, '') }))
    .addMemo(note.trim() ? (await import('@stellar/stellar-sdk')).Memo.text(note.trim().slice(0, 28)) : (await import('@stellar/stellar-sdk')).Memo.none())
    .setTimeout(180)
    .build()
  const signed = await signTransaction(tx.toXDR(), { networkPassphrase: PASSPHRASE })
  if (!signed.signedTxXdr) throw new Error('Transaction was not signed in Freighter.')
  const result = await server.submitTransaction(TransactionBuilder.fromXDR(signed.signedTxXdr, PASSPHRASE))
  return result.hash
}

export type Donation = {
  id: string; hash: string; from: string; amount: string; asset: string;
  createdAt: string; memo: string; successful: boolean
}

export async function getDonations(destination: string): Promise<Donation[]> {
  const response = await server.payments().forAccount(destination).limit(100).order('desc').call()
  return response.records.flatMap((record: any) => {
    if (record.type !== 'payment' || record.asset_type !== 'native' || record.to !== destination) return []
    return [{
      id: record.id, hash: record.transaction_hash, from: record.from,
      amount: record.amount, asset: 'XLM', createdAt: record.created_at,
      memo: record.transaction?.memo ?? '', successful: true
    }]
  })
}