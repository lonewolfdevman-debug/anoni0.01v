'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Lock, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { formatNaira } from '@/lib/utils'

interface RevealPriceModalProps {
  onClose: () => void
}

export default function RevealPriceModal({ onClose }: RevealPriceModalProps) {
  const { currentUser } = useAppStore()
  const [price, setPrice] = useState(currentUser?.reveal_price?.toString() || '5000')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!currentUser) return
    const numericPrice = parseInt(price)
    if (isNaN(numericPrice) || numericPrice < 0) {
      toast.error('Please enter a valid price')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ reveal_price: numericPrice })
        .eq('id', currentUser.id)
      
      if (error) throw error
      toast.success('Reveal price updated!')
      onClose()
    } catch {
      toast.error('Failed to update price')
    } finally {
      setSaving(false)
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Lock size={18} className="text-primary" /> Set Reveal Price
            </h3>
            <p className="text-[#6b6b8a] text-xs mt-1">
              How much should users pay to see your real identity?
            </p>
          </div>
          <button onClick={onClose} className="text-[#6b6b8a] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6b8a] font-medium">₦</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-[#14141f] border border-[#1e1e32] rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-primary/60 transition-colors font-medium text-lg"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-purple-gradient text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Price'}
        </button>
      </motion.div>
    </div>
  )
}
