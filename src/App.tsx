import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownLeft, ArrowUpRight, CheckCircle2, ChevronDown, CircleDollarSign, Copy, ExternalLink, Eye, Globe2, HeartHandshake, LoaderCircle, RefreshCw, Search, ShieldCheck, Wallet, X } from 'lucide-react'
import { connectWallet, getBalance, getDonations, sendDonation, type Donation } from './stellar'

const short = (s: string, n = 6) => s ? s.slice(0, n) + '…' + s.slice(-5) : '—'
const money = (v: string | number) => Number(v).toLocaleString(undefined, { maximumFractionDigits: 4 })
const date = (v: string) => new Date(v).toLocaleString()
const explorer = (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`

export default function App() {
  const [destination, setDestination] = useState(() => localStorage.getItem('clearledger:destination') || '')
  const [wallet, setWallet] = useState('')
  const [balance, setBalance] = useState('0')
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [amount, setAmount] = useState('10')
  const [memo, setMemo] = useState('Donation')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)

  const refresh = useCallback(async (address = destination) => {
    if (!address) return
    setLoading(true); setError('')
    try { setDonations(await getDonations(address)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load Stellar activity.') }
    finally { setLoading(false) }
  }, [destination])

  useEffect(() => { if (destination) refresh(destination) }, [destination, refresh])

  const total = useMemo(() => donations.reduce((sum, d) => sum + Number(d.amount), 0), [donations])
  const filtered = useMemo(() => donations.filter(d => [d.from, d.memo, d.hash].join(' ').toLowerCase().includes(query.toLowerCase())), [donations, query])

  async function handleConnect() {
    setConnecting(true); setError('')
    try { const address = await connectWallet(); setWallet(address); setBalance(await getBalance(address)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Wallet connection failed.') }
    finally { setConnecting(false) }
  }

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault(); setError(''); setNotice('')
    if (!wallet) { setError('Connect your Freighter wallet first.'); return }
    if (!destination) { setError('Set the receiving Stellar account first.'); return }
    setLoading(true)
    try {
      const hash = await sendDonation(wallet, destination, amount, memo)
      setNotice(`Donation submitted successfully. Transaction: ${hash}`)
      setModal(false); await refresh(destination); setBalance(await getBalance(wallet))
    } catch (e) { setError(e instanceof Error ? e.message : 'Donation failed.') }
    finally { setLoading(false) }
  }

  function saveDestination(e: React.FormEvent) {
    e.preventDefault()
    const value = destination.trim()
    if (!/^G[A-Z2-7]{55}$/.test(value)) { setError('Please enter a valid Stellar public address beginning with G.'); return }
    localStorage.setItem('clearledger:destination', value); setDestination(value); setError(''); setNotice('Tracking account updated.')
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value); setNotice('Copied to clipboard.')
  }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark"><Activity size={21}/></span><span>clearledger<span className="brand-dot">.</span></span></a>
      <nav><a className="active" href="#overview">Overview</a><a href="#activity">Transactions</a><a href="#how">How it works</a></nav>
      <div className="top-actions"><span className="network"><i/> Stellar Testnet</span><button className="wallet-btn" onClick={handleConnect} disabled={connecting}>{connecting ? <LoaderCircle className="spin" size={16}/> : <Wallet size={16}/>} {wallet ? short(wallet, 5) : 'Connect wallet'}</button></div>
    </header>

    <main>
      <section className="hero" id="overview"><div className="hero-copy"><div className="eyebrow"><span/> OPEN LEDGER · PUBLICLY VERIFIABLE</div><h1>Every gift.<br/><em>Out in the open.</em></h1><p>Follow donations as they happen on the Stellar blockchain. No hidden numbers, no private spreadsheets — just on-chain records anyone can verify.</p><div className="hero-buttons"><button className="primary" onClick={() => setModal(true)}><HeartHandshake size={17}/> Make a donation <ArrowUpRight size={16}/></button><a className="text-link" href="#activity">Explore transactions <ArrowDownLeft size={16}/></a></div></div>
        <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core"><Globe2 size={46}/><span>STELLAR<br/>NETWORK</span></div><div className="float-card float-top"><span className="float-icon"><ShieldCheck size={16}/></span><span><b>On-chain verified</b><small>Public ledger data</small></span><CheckCircle2 className="green" size={18}/></div><div className="float-card float-bottom"><span className="float-icon"><ArrowDownLeft size={17}/></span><span><b>Transparent by design</b><small>Every payment traceable</small></span></div></div>
      </section>

      <section className="stats"><div className="stat"><span className="stat-label">TOTAL DONATIONS TRACKED <Eye size={15}/></span><strong>{money(total)} <small>XLM</small></strong><p>Confirmed payments to this account</p></div><div className="stat"><span className="stat-label">TOTAL TRANSACTIONS <Activity size={15}/></span><strong>{donations.length.toLocaleString()}</strong><p>Successful native XLM payments</p></div><div className="stat"><span className="stat-label">TRACKING STATUS <ShieldCheck size={15}/></span><strong className="status-value"><i/> {destination ? 'Live tracking' : 'Not configured'}</strong><p>{destination ? short(destination, 10) : 'Add a receiving wallet below'}</p></div><div className="stat stat-network"><span className="stat-label">NETWORK <Globe2 size={15}/></span><strong>Stellar</strong><p>Fast · Low-cost · Public</p></div></section>

      <section className="account-panel"><div><div className="section-kicker">TRACK A WALLET</div><h2>Choose the donation address</h2><p>Enter the Stellar public key receiving donations. Activity is read directly from Horizon.</p></div><form className="address-form" onSubmit={saveDestination}><input value={destination} onChange={e => setDestination(e.target.value)} placeholder="G… Paste receiving Stellar public key" spellCheck={false}/><button className="dark-btn">Track account <ArrowUpRight size={15}/></button></form></section>

      {notice && <div className="notice"><CheckCircle2 size={16}/><span>{notice.length > 115 ? notice.slice(0, 115) + '…' : notice}</span><button onClick={() => setNotice('')}><X size={15}/></button></div>}
      {error && <div className="error"><span>{error}</span><button onClick={() => setError('')}><X size={15}/></button></div>}

      <section className="activity-section" id="activity"><div className="section-heading"><div><div className="section-kicker">THE PUBLIC RECORD</div><h2>Donation activity</h2><p>Each entry is a successful payment recorded on Stellar Testnet.</p></div><button className="refresh-btn" onClick={() => refresh()} disabled={!destination || loading}>{loading ? <LoaderCircle size={16} className="spin"/> : <RefreshCw size={16}/>} Refresh ledger</button></div>
        <div className="table-toolbar"><div className="table-title"><span className="live-pulse"/> Latest transactions <span className="count">{filtered.length}</span></div><div className="searchbox"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search address, memo or hash"/></div></div>
        <div className="table-wrap"><table><thead><tr><th>DONOR / SENDER</th><th>AMOUNT</th><th>MEMO</th><th>DATE & TIME</th><th>VERIFICATION</th></tr></thead><tbody>
          {!destination ? <tr><td colSpan={5}><div className="empty"><Globe2 size={25}/><b>No wallet selected</b><span>Enter a Stellar receiving address above to load its public donation history.</span></div></td></tr> : loading && donations.length === 0 ? <tr><td colSpan={5}><div className="empty"><LoaderCircle className="spin" size={24}/><span>Reading the Stellar ledger…</span></div></td></tr> : filtered.length === 0 ? <tr><td colSpan={5}><div className="empty"><Search size={24}/><b>No payments found</b><span>No matching native XLM payments were returned for this account.</span></div></td></tr> : filtered.map(d => <tr key={d.id}><td><div className="sender"><span className="sender-icon"><ArrowDownLeft size={16}/></span><span><b>{short(d.from, 8)}</b><small>Stellar account</small></span><button className="icon-btn" title="Copy sender" onClick={() => copy(d.from)}><Copy size={13}/></button></div></td><td><b className="amount">+{money(d.amount)} <small>XLM</small></b></td><td><span className="memo">{d.memo || '—'}</span></td><td><span className="date">{date(d.createdAt)}</span></td><td><a className="verified" href={explorer(d.hash)} target="_blank" rel="noreferrer"><CheckCircle2 size={15}/> Verified <ExternalLink size={12}/></a></td></tr>)}
        </tbody></table></div><div className="table-foot"><span><ShieldCheck size={14}/> Data fetched from Stellar Horizon API</span><span>Showing up to 100 recent payments · Testnet</span></div>
      </section>

      <section className="how-section" id="how"><div><div className="section-kicker">BUILT FOR TRUST</div><h2>Transparency is not a promise.<br/><em>It's the protocol.</em></h2></div><div className="how-grid"><article><span>01</span><h3>Public by default</h3><p>Stellar payments are recorded on a public ledger. Anyone can inspect the transaction history.</p></article><article><span>02</span><h3>Independently verifiable</h3><p>Open any transaction in Stellar Expert to verify sender, amount, timestamp and ledger status.</p></article><article><span>03</span><h3>No made-up totals</h3><p>Totals on this page are calculated from successful native XLM payments returned by Horizon.</p></article></div></section>
    </main>
    <footer><a className="brand" href="#"><span className="brand-mark"><Activity size={18}/></span><span>clearledger<span className="brand-dot">.</span></span></a><span>Built on Stellar · Testnet prototype</span><a href="https://developers.stellar.org/" target="_blank" rel="noreferrer">Stellar developer docs <ExternalLink size={12}/></a></footer>

    {modal && <div className="modal-backdrop" onClick={() => setModal(false)}><div className="donate-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setModal(false)}><X size={18}/></button><div className="modal-icon"><HeartHandshake size={23}/></div><div className="section-kicker">SUPPORT TRANSPARENCY</div><h2>Make a donation</h2><p>Your wallet will review and sign this XLM payment before it is submitted to Stellar Testnet.</p><form onSubmit={handleDonate}><label>Donation amount <div className="amount-input"><input type="number" min="0.0000001" step="any" value={amount} onChange={e => setAmount(e.target.value)} required/><b>XLM</b></div></label><label>Public memo <input value={memo} maxLength={28} onChange={e => setMemo(e.target.value)} placeholder="What is this donation for?"/></label><div className="recipient"><span>RECEIVING ACCOUNT</span><b>{destination ? short(destination, 12) : 'Not configured'}</b></div><button className="primary full" disabled={loading || !destination || !wallet}>{loading ? <LoaderCircle size={17} className="spin"/> : <Wallet size={17}/>} {wallet ? 'Review donation in Freighter' : 'Connect wallet to continue'}</button><small className="modal-note">Testnet XLM has no monetary value. Verify the receiving address before sending.</small></form></div></div>}
  </div>
}