'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, MessageCircle, Radio, User, LogIn } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function MobileNav() {
  const pathname = usePathname()
  const { currentUser, messageCount } = useAppStore()

  const guestItems = [
    { label: 'Home',     href: '/',         icon: Home },
    { label: 'Discover', href: '/discover', icon: Compass },
    { label: 'Live',     href: '/live',     icon: Radio },
    { label: 'Log In',   href: '/login',    icon: LogIn },
  ]

  const authItems = [
    { label: 'Home',     href: '/',         icon: Home },
    { label: 'Discover', href: '/discover', icon: Compass },
    { label: 'Live',     href: '/live',     icon: Radio },
    { label: 'Messages', href: '/messages', icon: MessageCircle, badge: messageCount },
    { label: 'Profile',  href: '/profile',  icon: User },
  ]

  const items = currentUser ? authItems : guestItems

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[#0f0f1a]/95 backdrop-blur-md border-t border-[#1e1e32] flex items-center justify-around z-40 px-2">
      {items.map(item => {
        const Icon = item.icon
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link key={item.href} href={item.href} className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full">
            <div className={`flex flex-col items-center gap-0.5 transition-all ${active ? 'text-purple-400' : 'text-[#6b6b8a]'}`}>
              <Icon size={20} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </div>
            {(item as any).badge !== undefined && (item as any).badge > 0 && (
              <span className="absolute top-2 right-1/4 translate-x-1/2 bg-purple-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {(item as any).badge > 9 ? '9+' : (item as any).badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
