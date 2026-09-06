'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Lock, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { formatNaira } from '@/lib/utils'

interface RevealModalProps {
  targetUserId: string
  targetUserAlias: string
  revealPrice: number
  onClose: () => void
  onSuccess: (revealedUser: any) => void
}

export default function RevealModal({ targetUserId, targetUserAlias, revealPrice, onClose, onSuccess }: RevealModalProps) {
  const { currentUser } = useAppStore()
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [revealedData, setRevealedData] = useState<any>(null)

  const handleReveal = async () => {
    if (!currentUser) return
    if (currentUser.wallet_balance < revealPrice) {
      toast.error('Insufficient wallet balance to purchase identity reveal')
      return
    }

    setProcessing(true)
    try {
      // Create reveal purchase record
      const { error: revealError } = await supabase.from('identity_reveals').insert({
        buyer_id: currentUser.id,
        target_id: targetUserId,
        amount_paid: revealPrice,
      })

      if (revealError) throw revealError

      // Deduct from buyer's wallet, add to target's wallet (this would usually be a db transaction / function,
      // but we write standard logs into wallet_transactions which can be computed/processed, or we can trigger it)
      await supabase.from('wallet_transactions').insert([
        {
          user_id: currentUser.id,
          amount: -revealPrice,
          transaction_type: 'reveal_purchase',
          recipient_id: targetUserId,
          status: 'completed',
        }
      ])

      // Retrieve public details of revealed user
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('username, display_name, profile_picture')
        .eq('id', targetUserId)
        .single()

      if (fetchError) throw fetchError

      setRevealedData(userData)
      setSuccess(true)
      onSuccess(userData)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to purchase reveal')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#12121d] border border-[#1e1e32] rounded-3xl p-6 w-full max-w-sm shadow-modal"
      >
        {success && revealedData ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Check size={32} className="text-green-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Identity Unlocked!</p>
              <p className="text-[#6b6b8a] text-sm mt-1">{targetUserAlias} is actually:</p>
            </div>
            
            <div className="bg-[#14141f] border border-[#1e1e32] p-4 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-xl">
                {revealedData.profile_picture ? (
                  <img src={revealedData.profile_picture} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>👻</span>
                )}
              </div>
              <div className="text-left">
                <p className="text-white font-bold">{revealedData.display_name}</p>
                <p className="text-[#6b6b8a] text-xs">@{revealedData.username}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#1e1e32] hover:bg-[#282845] text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Lock size={18} className="text-primary" /> Reveal Identity
                </h3>
                <p className="text-[#6b6b8a] text-xs mt-1">Unlock real identity of {targetUserAlias}</p>
              </div>
              <button onClick={onClose} className="text-[#6b6b8a] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="bg-[#14141f] rounded-2xl p-4 border border-[#1e1e32] space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#6b6b8a]">Cost to Reveal</span>
                <span className="text-white font-bold">{formatNaira(revealPrice)}</span>
              </div>
              <div className="h-[1px] bg-[#1e1e32]" />
              <div className="flex justify-between text-sm">
                <span className="text-[#6b6b8a]">Your Balance</span>
                <span className="text-white font-medium">{formatNaira(currentUser?.wallet_balance ?? 0)}</span>
              </div>
            </div>

            <button
              onClick={handleReveal}
              disabled={processing}
              className="w-full bg-purple-gradient text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? 'Processing...' : `Pay ${formatNaira(revealPrice)}`}
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
