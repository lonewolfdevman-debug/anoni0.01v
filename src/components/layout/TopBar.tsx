'use client'
import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, ChevronDown, Eye, EyeOff, LogOut, User, Settings, LogIn } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export default function TopBar() {
  const { currentUser, setCurrentUser, notificationCount, isAnonymousMode, toggleAnonymousMode } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await supabase.auth.signOut()
    setCurrentUser(null)
    toast.success('Signed out')
  }

  return (
    <header className="h-14 bg-[#0f0f1a]/95 backdrop-blur-md border-b border-[#1e1e32] flex items-center gap-4 px-4 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-xs relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b8a]" />
        <input
          type="text"
          placeholder="Search users, aliases..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[#14141f] border border-[#1e1e32] rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-[#6b6b8a] focus:outline-none focus:border-purple-600/60 transition-colors"
          onKeyDown={e => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              router.push(`/discover?q=${encodeURIComponent(searchQuery)}`)
            }
          }}
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">

        {currentUser ? (
          /* ── LOGGED IN STATE ── */
          <>
            {/* Anonymous toggle */}
            <button
              onClick={toggleAnonymousMode}
              title={isAnonymousMode ? 'Anonymous mode ON' : 'Anonymous mode OFF'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isAnonymousMode
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-600/40'
                  : 'bg-[#14141f] text-[#6b6b8a] border border-[#1e1e32] hover:border-purple-600/40'
              }`}
            >
              {isAnonymousMode ? <EyeOff size={12} /> : <Eye size={12} />}
              {isAnonymousMode ? 'Anon' : 'Public'}
            </button>

            {/* Notification bell */}
            <Link href="/notifications" className="relative">
              <button className="w-9 h-9 bg-[#14141f] border border-[#1e1e32] rounded-full flex items-center justify-center text-[#a1a1b5] hover:text-white hover:border-purple-600/40 transition-all">
                <Bell size={16} />
              </button>
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-purple-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>

            {/* User avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 bg-[#14141f] border border-[#1e1e32] rounded-full pl-1 pr-2 py-1 hover:border-purple-600/40 transition-all"
              >
                <Avatar src={currentUser.profile_picture} name={currentUser.display_name} size={28} isPremium={currentUser.premium_status} />
                <span className="text-white text-xs font-medium hidden sm:block max-w-[80px] truncate">
                  {currentUser.display_name}
                </span>
                <ChevronDown size={12} className="text-[#6b6b8a]" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-[#14141f] border border-[#1e1e32] rounded-2xl py-2 shadow-2xl z-50"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-[#1e1e32]">
                      <p className="text-white text-sm font-semibold">{currentUser.display_name}</p>
                      <p className="text-[#6b6b8a] text-xs">@{currentUser.anonymous_alias}</p>
                    </div>

                    <Link href="/profile" onClick={() => setUserMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#a1a1b5] hover:text-white hover:bg-[#1a1a2e] transition-colors cursor-pointer">
                        <User size={14} /> My Profile
                      </div>
                    </Link>
                    <Link href="/settings" onClick={() => setUserMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#a1a1b5] hover:text-white hover:bg-[#1a1a2e] transition-colors cursor-pointer">
                        <Settings size={14} /> Settings
                      </div>
                    </Link>

                    <div className="border-t border-[#1e1e32] my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-[#1a1a2e] transition-colors"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* ── GUEST STATE ── */
          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-[#a1a1b5] bg-[#14141f] border border-[#1e1e32] hover:text-white hover:border-purple-600/50 transition-all">
                <LogIn size={14} />
                Log In
              </button>
            </Link>
            <Link href="/signup">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
              >
                Sign Up
              </button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
