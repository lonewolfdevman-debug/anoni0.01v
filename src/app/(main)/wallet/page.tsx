'use client'

import { useState } from 'react'
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, Landmark } from 'lucide-react'

const mockTransactions = [
  { id: '1', type: 'credit', label: 'Tip received from @Ghost44', amount: 500, date: '2026-09-06' },
  { id: '2', type: 'debit', label: 'Tip sent to @Nova66', amount: 200, date: '2026-09-05' },
  { id: '3', type: 'credit', label: 'Content unlock revenue', amount: 1500, date: '2026-09-04' },
  { id: '4', type: 'debit', label: 'Premium subscription', amount: 2000, date: '2026-09-01' },
]

export default function WalletPage() {
  const [tab, setTab] = useState<'overview' | 'withdraw'>('overview')
  const balance = 4200

  return (
    <div className="w-full max-w-[640px] mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
        <Wallet className="text-primary" /> Wallet
      </h1>

      {/* Balance card */}
      <div className="bg-purple-gradient rounded-3xl p-6 mb-6 shadow-purple-glow">
        <p className="text-white/70 text-sm font-medium mb-1">Available Balance</p>
        <p className="text-white text-4xl font-black">₦{balance.toLocaleString()}</p>
        <div className="flex gap-3 mt-5">
          <button className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Plus size={15} /> Add Funds
          </button>
          <button className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Landmark size={15} /> Withdraw
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['overview', 'withdraw'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'bg-primary text-white' : 'bg-bg-card border border-border text-text-secondary hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-2">
          <h3 className="text-white font-semibold mb-3">Recent Transactions</h3>
          {mockTransactions.map(tx => (
            <div key={tx.id} className="bg-bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                tx.type === 'credit' ? 'bg-success/15' : 'bg-live/15'
              }`}>
                {tx.type === 'credit'
                  ? <ArrowDownLeft size={18} className="text-success" />
                  : <ArrowUpRight size={18} className="text-live" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{tx.label}</p>
                <p className="text-text-muted text-xs">{tx.date}</p>
              </div>
              <p className={`font-bold text-sm ${tx.type === 'credit' ? 'text-success' : 'text-live'}`}>
                {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'withdraw' && (
        <div className="bg-bg-card border border-border rounded-3xl p-6">
          <h3 className="text-white font-bold mb-4">Withdraw Funds</h3>
          <div className="space-y-4">
            <div>
              <label className="text-text-secondary text-sm block mb-1.5">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. First Bank"
                className="w-full bg-bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-text-secondary text-sm block mb-1.5">Account Number</label>
              <input
                type="text"
                placeholder="0123456789"
                className="w-full bg-bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-text-secondary text-sm block mb-1.5">Amount (₦)</label>
              <input
                type="number"
                placeholder="Min ₦500"
                min={500}
                max={balance}
                className="w-full bg-bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary/60"
              />
            </div>
            <button className="w-full bg-purple-gradient text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
              Request Withdrawal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
