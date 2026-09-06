'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import RightPanel from '@/components/layout/RightPanel'
import MobileNav from '@/components/layout/MobileNav'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { setCurrentUser } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (user) setCurrentUser(user)
        }
      } catch (e) {
        console.error('Session fetch error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (user) setCurrentUser(user)
      }
    })

    return () => { authListener.subscription.unsubscribe() }
  }, [setCurrentUser])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#090910', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#6b6b8a', fontSize: 14 }}>Loading Anoni...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090910', color: '#fff', display: 'flex', position: 'relative' }}>
      {/* Fixed left sidebar — 220px wide, only desktop */}
      <Sidebar />

      {/* Center scrollable content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        /* Leave room for fixed sidebar on desktop, right panel on xl */
        paddingLeft: 'clamp(0px, 220px, 220px)',
        paddingRight: 'clamp(0px, 0px, 280px)',
        paddingBottom: 60,
      }}
        className="main-content"
      >
        <TopBar />
        <main style={{ flex: 1, width: '100%' }}>
          {children}
        </main>
      </div>

      {/* Fixed right panel — 280px, only xl */}
      <RightPanel />

      {/* Fixed mobile bottom nav */}
      <MobileNav />

      <style>{`
        @media (max-width: 1023px) {
          .main-content { padding-left: 0 !important; }
        }
        @media (min-width: 1280px) {
          .main-content { padding-right: 280px !important; }
        }
      `}</style>
    </div>
  )
}
