'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Copy, TrendingUp, Radio, ChevronRight, Crown, LogIn, Award, Landmark, Sparkles, TrendingDown, DollarSign } from 'lucide-react'
import { formatNaira } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import RevealPriceModal from '@/components/wallet/RevealPriceModal'

const trendingUsers = [
  { rank: 1, alias: 'Nova66' },
  { rank: 2, alias: 'Venom21' },
  { rank: 3, alias: 'Galaxy77' },
  { rank: 4, alias: 'Drift45' },
]

export default function RightPanel() {
  const { currentUser } = useAppStore()
  const [copied, setCopied] = useState(false)
  const [revealModalOpen, setRevealModalOpen] = useState(false)
  
  // Realtime financial state
  const [creatorEarnings, setCreatorEarnings] = useState(0)
  const [revealEarnings, setRevealEarnings] = useState(0)
  const [recentSubscribers, setRecentSubscribers] = useState<any[]>([])
  const [recentTips, setRecentTips] = useState<any[]>([])

  useEffect(() => {
    if (!currentUser) return

    const fetchEarningsAndStats = async () => {
      try {
        // Fetch creator earnings from creator profiles
        const { data: creatorProfile } = await supabase
          .from('creator_profiles')
          .select('total_earnings')
          .eq('user_id', currentUser.id)
          .single()
        const cp = creatorProfile as any
        if (cp) {
          setCreatorEarnings(Number(cp.total_earnings) || 0)
        }

        // Fetch reveal earnings (sum of reveal purchases transactions)
        const { data: revealTx } = await supabase
          .from('wallet_transactions')
          .select('amount')
          .eq('recipient_id', currentUser.id)
          .eq('transaction_type', 'reveal_purchase')
        if (revealTx) {
          const sum = (revealTx as any[]).reduce((acc, curr: any) => acc + Number(curr.amount), 0)
          setRevealEarnings(Math.abs(sum))
        }

        // Fetch recent subscribers
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('id, subscriber_id, created_at, subscriber:users!subscriptions_subscriber_id_fkey(display_name, anonymous_alias)')
          .eq('creator_id', currentUser.id)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(3)
        if (subs) {
          setRecentSubscribers((subs as any[]).map((s: any) => s.subscriber).filter(Boolean))
        }

        // Fetch recent tips
        const { data: tips } = await supabase
          .from('wallet_transactions')
          .select('id, amount, created_at, sender:users!wallet_transactions_user_id_fkey(display_name, anonymous_alias)')
          .eq('recipient_id', currentUser.id)
          .eq('transaction_type', 'tip')
          .order('created_at', { ascending: false })
          .limit(3)
        if (tips) {
          setRecentTips((tips as any[]).map((t: any) => ({
            senderName: t.sender?.display_name || 'Anonymous User',
            senderAlias: t.sender?.anonymous_alias || 'Anon',
            amount: Math.abs(Number(t.amount))
          })))
        }

      } catch (err) {
        console.error('Error fetching panel stats:', err)
      }
    }

    fetchEarningsAndStats()

    // Subscribe to realtime wallet transaction updates
    const channel = supabase
      .channel('right-panel-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, () => {
        fetchEarningsAndStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
        fetchEarningsAndStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [currentUser])

  const copyAlias = () => {
    if (currentUser?.anonymous_alias) {
      navigator.clipboard.writeText(currentUser.anonymous_alias)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <>
      <style>{`
        .right-panel-aside {
          display: none;
          flex-direction: column;
          width: 280px;
          min-height: 100vh;
          background: #0f0f1a;
          border-left: 1px solid #1e1e32;
          position: fixed;
          right: 0;
          top: 0;
          padding-top: 56px;
          overflow-y: auto;
          scrollbar-width: none;
          z-index: 30;
        }
        @media (min-width: 1280px) {
          .right-panel-aside { display: flex !important; }
        }
      `}</style>

      <aside className="right-panel-aside">
        <div className="p-4 flex flex-col gap-4">

          {currentUser ? (
            <>
              {/* Alias Card */}
              <div className="bg-[#12121d] border border-[#1e1e32] rounded-2xl p-4">
                <p className="text-[#6b6b8a] text-[10px] font-bold uppercase tracking-wider mb-2">Your Alias</p>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {currentUser.premium_status && <Crown size={14} className="text-[#f59e0b]" />}
                    <span className="text-white text-lg font-extrabold">{currentUser.anonymous_alias}</span>
                  </div>
                  <button onClick={copyAlias} className="text-[#6b6b8a] hover:text-white transition-colors">
                    {copied ? <span className="text-green-500 text-[10px] font-bold">Copied!</span> : <Copy size={14} />}
                  </button>
                </div>
                <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              {/* SECTION 1: Wallet Balance */}
              <div className="bg-[#12121d] border border-[#1e1e32] rounded-2xl p-4">
                <p className="text-[#6b6b8a] text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Landmark size={12} className="text-primary" /> Wallet Balance
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-white text-xl font-extrabold">
                    {formatNaira(currentUser.wallet_balance ?? 0)}
                  </span>
                  <Link href="/wallet">
                    <button className="bg-purple-gradient text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                      Top Up
                    </button>
                  </Link>
                </div>
              </div>

              {/* SECTION 2 & 3: Earnings Panel */}
              <div className="bg-[#12121d] border border-[#1e1e32] rounded-2xl p-4 space-y-3">
                <p className="text-[#6b6b8a] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} className="text-[#f59e0b]" /> Monetization channels
                </p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#14141f] p-2.5 rounded-xl border border-[#1e1e32]">
                    <span className="text-[#6b6b8a] text-[9px] uppercase font-bold tracking-wider block">Creator Revenue</span>
                    <span className="text-white font-extrabold text-sm block mt-0.5">{formatNaira(creatorEarnings)}</span>
                  </div>
                  <div className="bg-[#14141f] p-2.5 rounded-xl border border-[#1e1e32]">
                    <span className="text-[#6b6b8a] text-[9px] uppercase font-bold tracking-wider block">Reveal Earnings</span>
                    <span className="text-white font-extrabold text-sm block mt-0.5">{formatNaira(revealEarnings)}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Recent Subscribers */}
              <div className="bg-[#12121d] border border-[#1e1e32] rounded-2xl p-4">
                <p className="text-[#6b6b8a] text-[10px] font-bold uppercase tracking-wider mb-2.5">Recent Subscribers</p>
                {recentSubscribers.length > 0 ? (
                  <div className="space-y-2">
                    {recentSubscribers.map((sub, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <Avatar src={null} name={sub.anonymous_alias} size={20} />
                        <span className="text-white font-medium truncate">{sub.display_name}</span>
                        <span className="text-primary text-[10px] ml-auto">Active</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#6b6b8a] text-xs italic">No active subscribers</p>
                )}
              </div>

              {/* SECTION 5: Recent Tips */}
              <div className="bg-[#12121d] border border-[#1e1e32] rounded-2xl p-4">
                <p className="text-[#6b6b8a] text-[10px] font-bold uppercase tracking-wider mb-2.5">Recent Tips</p>
                {recentTips.length > 0 ? (
                  <div className="space-y-2">
                    {recentTips.map((tip, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Avatar src={null} name={tip.senderAlias} size={20} />
                          <span className="text-white font-medium truncate">{tip.senderName}</span>
                        </div>
                        <span className="text-green-500 font-bold">+{formatNaira(tip.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#6b6b8a] text-xs italic">No tips received yet</p>
                )}
              </div>

              {/* Reveal Identity Price Card */}
              <div
                onClick={() => setRevealModalOpen(true)}
                className="rounded-2xl p-4 relative overflow-hidden cursor-pointer bg-gradient-to-br from-[#5b21b6] via-[#7c3aed] to-[#ec4899] hover:brightness-110 transition-all"
              >
                <div>
                  <p className="text-white font-bold text-xs mb-1">Set Reveal Price</p>
                  <p className="text-white/70 text-[10px] leading-relaxed mb-3">
                    Configure the price for other users to unlock your public details.
                  </p>
                  <div className="inline-flex bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">
                    Manage Identity
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Guest Join CTA */
            <div className="bg-[#7c3aed]/5 border border-[#7c3aed]/25 rounded-2xl p-5 text-center space-y-4">
              <div className="text-4xl">👻</div>
              <div className="space-y-1">
                <h3 className="text-white font-extrabold text-base">Join Anoni</h3>
                <p className="text-[#6b6b8a] text-xs leading-relaxed">
                  Post, chat, livestream, and earn — while protecting your identity.
                </p>
              </div>
              <div className="space-y-2">
                <Link href="/signup" className="block">
                  <button className="w-full bg-purple-gradient text-white text-sm font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                    Create Account
                  </button>
                </Link>
                <Link href="/login" className="block">
                  <button className="w-full bg-[#14141f] border border-[#1e1e32] text-[#a1a1b5] text-xs font-semibold py-2 rounded-xl hover:text-white transition-colors flex items-center justify-center gap-1.5">
                    <LogIn size={14} /> Log In
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Trending Now */}
          <div className="bg-[#12121d] border border-[#1e1e32] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp size={14} className="text-primary" />
              <span className="text-white text-xs font-bold">Trending Now</span>
            </div>
            <div className="space-y-3">
              {trendingUsers.map(user => (
                <div key={user.alias} className="flex items-center gap-2 text-xs">
                  <span className="text-[#6b6b8a] font-semibold w-4 text-center">{user.rank}</span>
                  <Avatar src={null} name={user.alias} size={24} />
                  <span className="text-white font-medium">{user.alias}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {revealModalOpen && (
          <RevealPriceModal onClose={() => setRevealModalOpen(false)} />
        )}
      </aside>
    </>
  )
}
