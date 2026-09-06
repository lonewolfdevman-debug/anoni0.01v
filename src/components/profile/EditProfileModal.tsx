'use client'
import { useState, useRef } from 'react'
import { X, Camera, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import toast from 'react-hot-toast'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { currentUser, setCurrentUser } = useAppStore()
  const [displayName, setDisplayName] = useState(currentUser?.display_name || '')
  const [username, setUsername] = useState(currentUser?.username || '')
  const [bio, setBio] = useState(currentUser?.bio || '')
  const [isCreator, setIsCreator] = useState(currentUser?.is_creator || false)
  const [revealPrice, setRevealPrice] = useState<number>(currentUser?.reveal_price || 5000)
  const [customRevealPrice, setCustomRevealPrice] = useState('')
  const [revealOption, setRevealOption] = useState<'1000' | '5000' | '10000' | '50000' | 'custom'>(
    [1000, 5000, 10000, 50000].includes(currentUser?.reveal_price || 0)
      ? String(currentUser?.reveal_price) as any
      : 'custom'
  )
  const [profilePicture, setProfilePicture] = useState(currentUser?.profile_picture || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen || !currentUser) return null

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${currentUser.id}/avatar-${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('photos').upload(path, file, { upsert: true })
      if (error) throw error

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(data.path)
      setProfilePicture(urlData.publicUrl)
      toast.success('Avatar uploaded!')
    } catch (err: any) {
      console.error(err)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!displayName.trim() || !username.trim()) {
      toast.error('Name and username are required')
      return
    }

    setSaving(true)
    try {
      const finalPrice = revealOption === 'custom' ? Number(customRevealPrice) || 0 : Number(revealOption)
      
      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName.trim(),
          username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
          bio: bio.trim(),
          is_creator: isCreator,
          reveal_price: finalPrice,
          profile_picture: profilePicture || null,
        })
        .eq('id', currentUser.id)

      if (error) throw error

      // Retrieve updated profile
      const { data: updated } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (updated) {
        setCurrentUser(updated)
      }
      toast.success('Profile updated!')
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#12121d] border border-[#1e1e32] w-full max-w-[500px] rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e32]">
          <h2 className="text-white font-bold text-lg">Edit Profile</h2>
          <button onClick={onClose} className="text-[#6b6b8a] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#14141f] border-2 border-primary flex items-center justify-center">
                {profilePicture ? (
                  <img src={profilePicture} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-[#6b6b8a]">👻</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-[#090910]/80 rounded-full flex items-center justify-center">
                  <RefreshCw size={20} className="text-primary animate-spin" />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
            <p className="text-xs text-[#6b6b8a] mt-2">Click to change profile picture</p>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-[#6b6b8a] text-xs font-semibold uppercase tracking-wider block mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your Display Name"
                className="w-full bg-[#14141f] border border-[#1e1e32] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-[#6b6b8a] text-xs font-semibold uppercase tracking-wider block mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                className="w-full bg-[#14141f] border border-[#1e1e32] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-[#6b6b8a] text-xs font-semibold uppercase tracking-wider block mb-1.5">Bio (max 500 chars)</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 500))}
                placeholder="Write something about yourself..."
                rows={3}
                className="w-full bg-[#14141f] border border-[#1e1e32] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors resize-none"
              />
              <p className="text-[10px] text-[#6b6b8a] text-right mt-1">{bio.length}/500</p>
            </div>

            {/* Creator Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#14141f] border border-[#1e1e32] rounded-2xl">
              <div>
                <h4 className="text-white text-sm font-bold">Creator Mode</h4>
                <p className="text-[#6b6b8a] text-xs mt-0.5">Enable creator subscriptions & benefits</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreator(!isCreator)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${isCreator ? 'bg-primary' : 'bg-[#1e1e32]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${isCreator ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Identity Reveal Price */}
            <div>
              <label className="text-[#6b6b8a] text-xs font-semibold uppercase tracking-wider block mb-2">Identity Reveal Price (₦)</label>
              <div className="grid grid-cols-5 gap-2 mb-2">
                {(['1000', '5000', '10000', '50000'] as const).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => { setRevealOption(option); setRevealPrice(Number(option)) }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      revealOption === option
                        ? 'bg-primary/10 border-primary text-white'
                        : 'bg-[#14141f] border-[#1e1e32] text-[#6b6b8a] hover:text-white'
                    }`}
                  >
                    ₦{Number(option).toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRevealOption('custom')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    revealOption === 'custom'
                      ? 'bg-primary/10 border-primary text-white'
                      : 'bg-[#14141f] border-[#1e1e32] text-[#6b6b8a] hover:text-white'
                  }`}
                >
                  Custom
                </button>
              </div>

              {revealOption === 'custom' && (
                <input
                  type="number"
                  value={customRevealPrice}
                  onChange={e => setCustomRevealPrice(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full bg-[#14141f] border border-[#1e1e32] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#14141f] border-t border-[#1e1e32] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#1e1e32] text-[#6b6b8a] font-bold text-sm hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-gradient text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
