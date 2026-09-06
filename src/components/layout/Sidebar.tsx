'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home, Compass, MessageCircle, Users, Radio, Star,
  Shield, Wallet, User, Settings, Crown, LogIn
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatNaira } from '@/lib/utils'

const navItems = [
  { label: 'Home',      href: '/',          icon: Home },
  { label: 'Discover',  href: '/discover',  icon: Compass },
  { label: 'Messages',  href: '/messages',  icon: MessageCircle, badge: true, requiresAuth: true },
  { label: 'Groups',    href: '/groups',    icon: Users },
  { label: 'Live',      href: '/live',      icon: Radio },
  { label: 'Creators',  href: '/creators',  icon: Star },
  { label: 'Premium',   href: '/premium',   icon: Shield },
  { label: 'Wallet',    href: '/wallet',    icon: Wallet, showBalance: true, requiresAuth: true },
  { label: 'Profile',   href: '/profile',   icon: User, requiresAuth: true },
  { label: 'Settings',  href: '/settings',  icon: Settings, requiresAuth: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { currentUser, messageCount } = useAppStore()

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <aside className="hidden lg:flex flex-col w-[220px] min-h-screen bg-[#0f0f1a] border-r border-[#1e1e32] fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1e1e32]">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Anoni"
            className="w-10 h-10 rounded-xl object-contain shadow-[0_0_15px_rgba(124,58,237,0.4)]"
          />
          <span className="text-white font-bold text-lg tracking-wide">
            Anon<span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>i</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          // Items that require auth show a lock hint when not logged in
          const locked = item.requiresAuth && !currentUser

          return (
            <Link
              key={item.href}
              href={locked ? '/login' : item.href}
              title={locked ? 'Sign in to access' : item.label}
            >
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-purple-600/20 text-white'
                    : locked
                    ? 'text-[#3d3d5c] cursor-pointer'
                    : 'text-[#a1a1b5] hover:bg-[#14141f] hover:text-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  active ? 'bg-purple-600 text-white' : locked ? 'text-[#3d3d5c]' : 'text-[#6b6b8a] group-hover:text-white'
                }`}>
                  <Icon size={16} />
                </div>
                <span className="text-sm font-medium flex-1">{item.label}</span>

                {/* Unread badge */}
                {item.badge && messageCount > 0 && currentUser && (
                  <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {messageCount > 99 ? '99+' : messageCount}
                  </span>
                )}

                {/* Wallet balance */}
                {item.showBalance && currentUser && (
                  <span className="text-[10px] text-purple-300 font-semibold">
                    {formatNaira(currentUser.wallet_balance)}
                  </span>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom section — changes based on auth state */}
      <div className="px-3 pb-5">
        {currentUser ? (
          /* Premium CTA for logged-in users */
          <div className="bg-[#14141f] border border-[#1e1e32] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={14} className="text-yellow-500" />
              <span className="text-white text-sm font-semibold">Go Premium</span>
            </div>
            <p className="text-[#6b6b8a] text-xs leading-relaxed mb-3">
              Unlock privacy filters, alias customization and more...
            </p>
            <Link href="/premium">
              <button className="w-full text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)' }}>
                Upgrade Now
              </button>
            </Link>
          </div>
        ) : (
          /* Sign in CTA for guests */
          <div className="bg-purple-600/10 border border-purple-600/20 rounded-2xl p-4">
            <p className="text-white text-sm font-semibold mb-1">Join Anoni</p>
            <p className="text-[#6b6b8a] text-xs leading-relaxed mb-3">
              Create an account to post, message, and go live.
            </p>
            <Link href="/signup">
              <button className="w-full text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                Create Account
              </button>
            </Link>
            <Link href="/login">
              <button className="w-full mt-2 text-[#a1a1b5] text-xs font-medium py-2 rounded-lg hover:text-white transition-colors flex items-center justify-center gap-1">
                <LogIn size={11} /> Log In
              </button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
