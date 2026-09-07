'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { Search, Plus, MessageSquare, Users, Star, Inbox, UserCheck, Ghost } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'
import type { ConversationWithUsers, ChatTab } from '@/types/messaging'
import type { UserRow } from '@/types/database'
import { motion, AnimatePresence } from 'framer-motion'

interface ConversationListProps {
  activeConvId: string | null
  onSelectConv: (conv: ConversationWithUsers) => void
  onNewChat: () => void
}

const TABS: { id: ChatTab; label: string; icon: React.ReactNode }[] = [
  { id: 'all',      label: 'All',      icon: <MessageSquare size={13} /> },
  { id: 'primary',  label: 'Primary',  icon: <Inbox size={13} /> },
  { id: 'requests', label: 'Requests', icon: <UserCheck size={13} /> },
  { id: 'groups',   label: 'Groups',   icon: <Users size={13} /> },
  { id: 'premium',  label: 'Premium',  icon: <Star size={13} /> },
]

export default function ConversationList({ activeConvId, onSelectConv, onNewChat }: ConversationListProps) {
  const { currentUser } = useAppStore()
  const [tab, setTab] = useState<ChatTab>('all')
  const [conversations, setConversations] = useState<ConversationWithUsers[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserRow[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, user_one_data:users!conversations_user_one_fkey(*), user_two_data:users!conversations_user_two_fkey(*)')
        .or(`user_one.eq.${currentUser.id},user_two.eq.${currentUser.id}`)
        .order('last_message_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        const convs: ConversationWithUsers[] = data.map((c: any) => ({
          ...c,
          other_user: c.user_one === currentUser.id ? c.user_two_data : c.user_one_data,
        }))
        setConversations(convs)
      }
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  // Realtime: update conversation list when new message arrives
  useEffect(() => {
    if (!currentUser) return
    const channel = supabase
      .channel('conv-list')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => {
        fetchConversations()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUser, fetchConversations])

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,anonymous_alias.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', currentUser?.id)
        .limit(8)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, currentUser])

  const startConversation = async (user: UserRow) => {
    if (!currentUser) return
    setSearchQuery('')
    setSearchResults([])

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(
        `and(user_one.eq.${currentUser.id},user_two.eq.${user.id}),and(user_one.eq.${user.id},user_two.eq.${currentUser.id})`
      )
      .single()

    if (existing) {
      const conv: ConversationWithUsers = { ...existing, other_user: user }
      onSelectConv(conv)
      return
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ user_one: currentUser.id, user_two: user.id })
      .select()
      .single()

    if (newConv) {
      const conv: ConversationWithUsers = { ...newConv, other_user: user }
      setConversations((prev: ConversationWithUsers[]) => [conv, ...prev])
      onSelectConv(conv)
    }
  }

  return (
    <div style={{
      width: 300, flexShrink: 0,
      background: '#0f0f1a', borderRight: '1px solid #1e1e32',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #1e1e32' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>Messages</h2>
          <button
            onClick={onNewChat}
            style={{
              width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="New message"
          >
            <Plus size={16} style={{ color: '#fff' }} />
          </button>
        </div>

        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: '#14141f', borderRadius: 12, border: '1px solid #1e1e32',
        }}>
          <Search size={14} style={{ color: '#6b6b8a', flexShrink: 0 }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search users, aliases or chats..."
            style={{
              flex: 1, background: 'transparent', color: '#fff',
              fontSize: 13, border: 'none', outline: 'none',
            }}
            className="placeholder-[#6b6b8a]"
          />
        </div>
      </div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: '#14141f', borderBottom: '1px solid #1e1e32',
              maxHeight: 280, overflowY: 'auto',
            }}
          >
            {searching && (
              <div style={{ padding: '8px 16px', color: '#6b6b8a', fontSize: 12 }}>Searching...</div>
            )}
            {searchResults.map(user => (
              <button
                key={user.id}
                onClick={() => startConversation(user)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar src={user.profile_picture} name={user.display_name} size={34} />
                <div>
                  <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user.display_name}</p>
                  <p style={{ color: '#6b6b8a', fontSize: 11 }}>
                    @{user.username} · <span style={{ color: 'rgba(168,85,247,0.8)' }}>{user.anonymous_alias}</span>
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 2, padding: '10px 10px 0',
        overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              background: tab === t.id ? 'rgba(124,58,237,0.2)' : 'transparent',
              color: tab === t.id ? '#a855f7' : '#6b6b8a',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', paddingTop: 8 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                padding: '10px 12px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1e1e32', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '60%', height: 11, background: '#1e1e32', borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ width: '80%', height: 9, background: '#1a1a2e', borderRadius: 6 }} />
                </div>
              </div>
            ))}
            <style>{`@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b6b8a' }}>
            <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 13, fontWeight: 600 }}>No conversations yet</p>
            <p style={{ fontSize: 12, marginTop: 6 }}>Search for a user to start chatting</p>
          </div>
        ) : (
          conversations.map(conv => (
            <ConvCard
              key={conv.id}
              conv={conv}
              active={conv.id === activeConvId}
              onClick={() => onSelectConv(conv)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ConvCard({ conv, active, onClick }: {
  conv: ConversationWithUsers
  active: boolean
  onClick: () => void
}) {
  const u = conv.other_user
  const unread = conv.unread_count || 0

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 12, margin: '1px 8px', border: 'none',
        background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
        cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
        width: 'calc(100% - 16px)',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#14141f' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar src={u?.profile_picture} name={u?.display_name || 'User'} size={44} isLive={u?.is_live} />
        {/* Online dot - placeholder */}
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: '#10b981', border: '2px solid #0f0f1a',
        }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {u?.anonymous_alias || u?.display_name || 'User'}
          </span>
          <span style={{ color: '#3d3d5c', fontSize: 10, flexShrink: 0, marginLeft: 4 }}>
            {conv.last_message_at ? timeAgo(conv.last_message_at) : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{
            color: unread > 0 ? '#c8c8e0' : '#6b6b8a', fontSize: 12,
            fontWeight: unread > 0 ? 600 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150,
          }}>
            {conv.last_message || 'Start a conversation'}
          </p>
          {unread > 0 && (
            <span style={{
              background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
              color: '#fff', fontSize: 10, fontWeight: 700,
              width: 18, height: 18, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
