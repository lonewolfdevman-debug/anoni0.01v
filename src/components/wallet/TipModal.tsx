'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Check } from 'lucide-react'
import { formatNaira } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import toast from 'react-hot-toast'

interface TipModalProps {
  recipientId: string
  recipientAlias: string
  onClose: () => void
}

const PRESET_AMOUNTS = [100, 500, 1000]

export default function TipModal({ recipientId, recipientAlias, onClose }: TipModalProps) {
  const { currentUser } = useAppStore()
  const [amount, setAmount] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const selectedAmount = amount ?? (custom ? parseInt(custom) : null)

  const handleTip = async () => {
    if (!currentUser || !selectedAmount || selectedAmount <= 0) return
    if (currentUser.wallet_balance < selectedAmount) {
      toast.error('Insufficient wallet balance')
      return
    }
    setProcessing(true)
    try {
      const { error } = await supabase.from('wallet_transactions').insert({
        user_id: currentUser.id,
        amount: -selectedAmount,
        transaction_type: 'tip',
        recipient_id: recipientId,
        status: 'completed',
      })
      if (error) throw error
      setSuccess(true)
      setTimeout(onClose, 2000)
    } catch {
      toast.error('Tip failed')
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
        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <p className="text-white font-bold text-lg">Tip Sent!</p>
            <p className="text-[#6b6b8a] text-sm mt-1">{formatNaira(selectedAmount!)} sent to {recipientAlias}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-bold text-lg">Send a Tip</h3>
                <p className="text-[#6b6b8a] text-sm">to {recipientAlias}</p>
              </div>
              <button onClick={onClose} className="text-[#6b6b8a] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Balance */}
            <div className="bg-[#14141f] rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="text-[#6b6b8a] text-xs">Your Balance</span>
              <span className="text-white font-semibold text-sm">
                {formatNaira(currentUser?.wallet_balance ?? 0)}
              </span>
            </div>

            {/* Preset amounts */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustom('') }}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    amount === a
                      ? 'bg-purple-gradient text-white'
                      : 'bg-[#14141f] text-[#a1a1b5] hover:text-white border border-[#1e1e32] hover:border-primary/50'
                  }`}
                >
                  {formatNaira(a)}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative mb-5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b8a] text-sm">₦</span>
              <input
                type="number"
                placeholder="Custom amount"
                value={custom}
                onChange={e => { setCustom(e.target.value); setAmount(null) }}
                className="w-full bg-[#14141f] border border-[#1e1e32] rounded-xl pl-7 pr-4 py-3 text-sm text-white placeholder-[#6b6b8a] focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            <button
              onClick={handleTip}
              disabled={!selectedAmount || processing}
              className="w-full bg-purple-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <DollarSign size={16} />
              {processing ? 'Sending...' : selectedAmount ? `Send ${formatNaira(selectedAmount)}` : 'Select Amount'}
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
