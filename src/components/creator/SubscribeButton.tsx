'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Check, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { formatNaira } from '@/lib/utils'

interface SubscribeButtonProps {
  creatorId: string
  creatorUsername: string
  price: number
  isSubscribed?: boolean
}

export default function SubscribeButton({
  creatorId,
  creatorUsername,
  price,
  isSubscribed: initialSubscribed = false,
}: SubscribeButtonProps) {
  const router = useRouter()
  const { currentUser, updateWalletBalance } = useAppStore()
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }
    if (subscribed) return

    const balance = currentUser.wallet_balance ?? 0
    if (balance < price) {
      toast.error(`Insufficient balance. You need ${formatNaira(price)}.`)
      router.push('/wallet')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('subscriptions').insert({
        subscriber_id: currentUser.id,
        creator_id: creatorId,
        amount_paid: price,
      })

      if (error) throw error

      // Deduct from wallet
      await supabase
        .from('users')
        .update({ wallet_balance: balance - price })
        .eq('id', currentUser.id)

      updateWalletBalance(-price)
      setSubscribed(true)
      toast.success(`Subscribed to @${creatorUsername}!`)
    } catch {
      toast.error('Subscription failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading || subscribed}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
        subscribed
          ? 'bg-success/15 text-success border border-success/30 cursor-default'
          : 'bg-purple-gradient text-white hover:opacity-90 disabled:opacity-60'
      }`}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : subscribed ? (
        <Check size={15} />
      ) : (
        <Crown size={15} />
      )}
      {subscribed ? 'Subscribed' : `Subscribe · ${formatNaira(price)}/mo`}
    </button>
  )
}
