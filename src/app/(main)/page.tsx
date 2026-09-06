'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CreatePost from '@/components/feed/CreatePost'
import PostCard from '@/components/feed/PostCard'
import CreatorCard from '@/components/creator/CreatorCard'
import LiveStreamCard from '@/components/live/LiveStreamCard'
import { useAppStore } from '@/store/useAppStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Users, TrendingUp, Radio, Ghost, Crown } from 'lucide-react'
import type { PostRow, UserRow, LivestreamRow, CreatorProfile } from '@/types/database'

type PostWithUser = PostRow & { user: UserRow; is_liked?: boolean }
type LiveWithCreator = LivestreamRow & { creator?: UserRow }
type CreatorWithProfile = UserRow & { creator_profile?: CreatorProfile; is_subscribed?: boolean }

const PAGE_SIZE = 20

const FEED_TABS = [
  { id: 'for_you',   label: 'For You',        icon: Flame },
  { id: 'following', label: 'Following',       icon: Users },
  { id: 'trending',  label: 'Trending',        icon: TrendingUp },
  { id: 'live',      label: 'Live Now',        icon: Radio },
  { id: 'anonymous', label: 'Anonymous',       icon: Ghost },
  { id: 'creators',  label: 'Creators',        icon: Crown },
]

/* ─── Mock data for when DB is empty ──────────────────────────── */
function getMockUser(id: string, name: string, alias: string, extras: Partial<UserRow> = {}): UserRow {
  return {
    id, email: `${name}@anoni.app`, username: name.toLowerCase(),
    display_name: name, profile_picture: null, bio: null,
    wallet_balance: 0, premium_status: false, anonymous_alias: alias,
    reveal_price: 5000, is_creator: false, is_verified: false, is_live: false,
    created_at: new Date().toISOString(), ...extras,
  }
}

function getMockPosts(): PostWithUser[] {
  const now = Date.now()
  return [
    {
      id: 'mock1', user_id: 'u1', post_type: 'video',
      caption: 'Sunset grind 🌅 — who else is up at this hour building something crazy?',
      media_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800',
      duration: 28, visibility: 'public', is_anonymous: false,
      like_count: 1240, comment_count: 423, share_count: 87,
      created_at: new Date(now - 1000 * 60 * 15).toISOString(),
      is_liked: false,
      user: getMockUser('u1', 'LunaPlayz', 'Nova66', { is_creator: true, is_verified: true, is_live: true }),
    },
    {
      id: 'mock2', user_id: 'u2', post_type: 'photo',
      caption: 'anonymous thoughts at 3am 👻 some things are better left unsaid but here we are',
      media_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800',
      thumbnail_url: null, duration: null, visibility: 'public', is_anonymous: true,
      like_count: 843, comment_count: 112, share_count: 45,
      created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      is_liked: false,
      user: getMockUser('u2', 'Phantom', 'Shadow27'),
    },
    {
      id: 'mock3', user_id: 'u3', post_type: 'audio',
      caption: 'Late night freestyle 🎤 — 60 seconds of raw energy. drop a 🔥 if you feel it',
      media_url: null, thumbnail_url: null, duration: 60,
      visibility: 'public', is_anonymous: false,
      like_count: 520, comment_count: 88, share_count: 22,
      created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      is_liked: false,
      user: getMockUser('u3', 'Mystic44', 'Ghost44'),
    },
    {
      id: 'mock4', user_id: 'u4', post_type: 'photo',
      caption: 'The city never sleeps 🌆 and neither do I apparently',
      media_url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=800',
      thumbnail_url: null, duration: null, visibility: 'public', is_anonymous: false,
      like_count: 312, comment_count: 41, share_count: 10,
      created_at: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
      is_liked: false,
      user: getMockUser('u4', 'Orbit33', 'Neon55'),
    },
    {
      id: 'mock5', user_id: 'u5', post_type: 'text',
      caption: 'If you could be anonymous for one day and say anything to anyone, what would you say? 🤔',
      media_url: null, thumbnail_url: null, duration: null,
      visibility: 'public', is_anonymous: true,
      like_count: 2100, comment_count: 891, share_count: 340,
      created_at: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
      is_liked: false,
      user: getMockUser('u5', 'Spectre', 'Void99'),
    },
  ]
}

function getMockLive(): LiveWithCreator[] {
  return [
    {
      id: 'l1', creator_id: 'u1', title: 'Chill beats & vibes 🎵',
      thumbnail_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800',
      room_name: 'room-nova66', status: 'live', viewer_count: 1842,
      is_subscriber_only: false, started_at: new Date().toISOString(), ended_at: null,
      created_at: new Date().toISOString(),
      creator: getMockUser('u1', 'LunaPlayz', 'Nova66', { is_live: true, is_creator: true }),
    },
    {
      id: 'l2', creator_id: 'u6', title: 'Anonymous Q&A 👻',
      thumbnail_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800',
      room_name: 'room-cipher', status: 'live', viewer_count: 654,
      is_subscriber_only: true, started_at: new Date().toISOString(), ended_at: null,
      created_at: new Date().toISOString(),
      creator: getMockUser('u6', 'CipherX', 'Cipher22', { is_live: true, is_creator: true }),
    },
    {
      id: 'l3', creator_id: 'u7', title: 'Late night talk 🌙',
      thumbnail_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800',
      room_name: 'room-pulse', status: 'live', viewer_count: 321,
      is_subscriber_only: false, started_at: new Date().toISOString(), ended_at: null,
      created_at: new Date().toISOString(),
      creator: getMockUser('u7', 'Pulse77', 'Pulse77', { is_live: true }),
    },
  ]
}

function getMockCreators(): CreatorWithProfile[] {
  return [
    {
      ...getMockUser('u1', 'LunaPlayz', 'Nova66', { is_creator: true, is_verified: true }),
      creator_profile: { id: 'cp1', user_id: 'u1', monthly_price: 1500, creator_description: 'Vibes & energy', total_subscribers: 8420, total_earnings: 0, created_at: new Date().toISOString() },
      is_subscribed: false,
    },
    {
      ...getMockUser('u6', 'CipherX', 'Cipher22', { is_creator: true, is_verified: true }),
      creator_profile: { id: 'cp2', user_id: 'u6', monthly_price: 2000, creator_description: 'Exclusive anonymous content', total_subscribers: 5100, total_earnings: 0, created_at: new Date().toISOString() },
      is_subscribed: false,
    },
    {
      ...getMockUser('u3', 'Mystic44', 'Ghost44', { is_creator: true }),
      creator_profile: { id: 'cp3', user_id: 'u3', monthly_price: 500, creator_description: 'Music & freestyles', total_subscribers: 1840, total_earnings: 0, created_at: new Date().toISOString() },
      is_subscribed: false,
    },
    {
      ...getMockUser('u8', 'Astra99', 'Astra99', { is_creator: true, is_verified: true }),
      creator_profile: { id: 'cp4', user_id: 'u8', monthly_price: 3000, creator_description: 'Premium lifestyle', total_subscribers: 12000, total_earnings: 0, created_at: new Date().toISOString() },
      is_subscribed: false,
    },
  ]
}

export default function HomeFeed() {
  const [activeTab, setActiveTab] = useState('for_you')
  const [posts, setPosts] = useState<PostWithUser[]>([])
  const [liveStreams, setLiveStreams] = useState<LiveWithCreator[]>([])
  const [creators, setCreators] = useState<CreatorWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const { currentUser } = useAppStore()
  const router = useRouter()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  /* ─── Fetch posts by tab ─────────────────────────────────────── */
  const fetchPosts = useCallback(async (tab: string, pageNum: number) => {
    if (pageNum === 0) setLoading(true)
    else setLoadingMore(true)

    try {
      const offset = pageNum * PAGE_SIZE

      if (tab === 'live') {
        // Fetch live streams
        const { data } = await supabase
          .from('livestreams')
          .select('*, creator:users(*)')
          .eq('status', 'live')
          .order('viewer_count', { ascending: false })
          .limit(12)
        setLiveStreams(data?.length ? (data as unknown as LiveWithCreator[]) : getMockLive())
        setHasMore(false)
        return
      }

      if (tab === 'creators') {
        // Fetch creator users with profiles
        const { data } = await supabase
          .from('users')
          .select('*, creator_profile:creator_profiles(*)')
          .eq('is_creator', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)
        setCreators(prev =>
          pageNum === 0
            ? (data?.length ? (data as unknown as CreatorWithProfile[]) : getMockCreators())
            : [...prev, ...(data as unknown as CreatorWithProfile[])]
        )
        setHasMore((data?.length ?? 0) === PAGE_SIZE)
        return
      }

      // Posts query
      let query = supabase
        .from('posts')
        .select('*, user:users(*)')
        .eq('visibility', 'public')
        .range(offset, offset + PAGE_SIZE - 1)

      if (tab === 'following' && currentUser) {
        // Get following IDs first
        const { data: followData } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', currentUser.id)
        const ids = (followData as any[])?.map((f: any) => f.following_id) ?? []
        if (!ids.length) {
          setPosts([])
          setHasMore(false)
          return
        }
        query = supabase
          .from('posts')
          .select('*, user:users(*)')
          .in('user_id', ids)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)
      } else if (tab === 'trending') {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        query = supabase
          .from('posts')
          .select('*, user:users(*)')
          .eq('visibility', 'public')
          .gte('created_at', since)
          .order('like_count', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)
      } else if (tab === 'anonymous') {
        query = supabase
          .from('posts')
          .select('*, user:users(*)')
          .eq('visibility', 'public')
          .eq('is_anonymous', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)
      } else {
        // for_you — general feed ordered by recency
        query = supabase
          .from('posts')
          .select('*, user:users(*)')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)
      }

      const { data, error } = await query
      if (error) throw error

      // Check which posts the current user has liked
      let likedSet = new Set<string>()
      if (currentUser && data?.length) {
        const { data: likeData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', currentUser.id)
          .in('post_id', data.map((p: any) => p.id))
        likedSet = new Set((likeData as any[])?.map((l: any) => l.post_id))
      }

      const tagged = (data || []).map((p: any) => ({ ...p, is_liked: likedSet.has(p.id) }))
      const result = tagged.length ? (tagged as PostWithUser[]) : (pageNum === 0 ? getMockPosts() : [])

      setPosts(prev => pageNum === 0 ? result : [...prev, ...result])
      setHasMore(tagged.length === PAGE_SIZE)
    } catch {
      if (pageNum === 0) setPosts(getMockPosts())
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [currentUser])

  /* ─── Tab switch ─────────────────────────────────────────────── */
  useEffect(() => {
    setPage(0)
    setPosts([])
    setLiveStreams([])
    setCreators([])
    setHasMore(true)
    fetchPosts(activeTab, 0)
  }, [activeTab, fetchPosts])

  /* ─── Infinite scroll observer ───────────────────────────────── */
  useEffect(() => {
    if (!bottomRef.current) return
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchPosts(activeTab, nextPage)
        }
      },
      { rootMargin: '200px' }
    )
    observerRef.current.observe(bottomRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, loading, page, activeTab, fetchPosts])

  /* ─── Realtime subscriptions ─────────────────────────────────── */
  useEffect(() => {
    const channel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
        const newPost = payload.new as PostWithUser
        if (activeTab === 'for_you' || activeTab === 'trending') {
          // Fetch with user join
          supabase
            .from('posts')
            .select('*, user:users(*)')
            .eq('id', newPost.id)
            .single()
            .then(({ data }) => {
              if (data) setPosts(prev => [data as unknown as PostWithUser, ...prev])
            })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeTab])

  const isPostTab = !['live', 'creators'].includes(activeTab)

  return (
    <div className="w-full max-w-[680px] mx-auto py-6 px-3">

      {/* ── Feed Tabs ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 16, marginBottom: 6,
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      }}>
        {FEED_TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s',
                background: isActive ? 'rgba(124,58,237,0.2)' : 'transparent',
                color: isActive ? '#fff' : '#6b6b8a',
                border: `1px solid ${isActive ? 'rgba(124,58,237,0.5)' : 'transparent'}`,
              }}
            >
              <Icon size={13} style={{ color: isActive ? '#a855f7' : '#6b6b8a' }} />
              {tab.label}
              {tab.id === 'live' && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#ef4444',
                  animation: 'livePulse 1.2s ease-in-out infinite',
                }} />
              )}
            </button>
          )
        })}
      </div>
      <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      {/* ── Guest join banner ─────────────────────────────────────── */}
      {!currentUser && (
        <div style={{
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 18, padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              🔥 Join Anoni — Be you. Anonymously.
            </p>
            <p style={{ color: '#a1a1b5', fontSize: 12 }}>
              Create an account to post, like, comment, and go live.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                color: '#a1a1b5', background: '#14141f', border: '1px solid #1e1e32', cursor: 'pointer',
              }}
            >
              Log In
            </button>
            <button
              onClick={() => router.push('/signup')}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                color: '#fff', background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                border: 'none', cursor: 'pointer',
              }}
            >
              Sign Up Free
            </button>
          </div>
        </div>
      )}

      {/* ── Create Post (logged-in only, posts tabs) ─────────────── */}
      {currentUser && isPostTab && (
        <div style={{ marginBottom: 20 }}>
          <CreatePost onPost={() => fetchPosts(activeTab, 0)} />
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: '#12121d', border: '1px solid #1e1e32', borderRadius: 20,
              overflow: 'hidden', animation: 'shimmer 1.5s ease-in-out infinite',
            }}>
              <div style={{ padding: 16, display: 'flex', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#1e1e32' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '40%', height: 12, borderRadius: 6, background: '#1e1e32', marginBottom: 8 }} />
                  <div style={{ width: '25%', height: 10, borderRadius: 6, background: '#1e1e32' }} />
                </div>
              </div>
              <div style={{ height: 200, background: '#1a1a2e', margin: '0 0 12px' }} />
              <div style={{ padding: '0 16px 16px', display: 'flex', gap: 16 }}>
                {[1, 2, 3].map(j => (
                  <div key={j} style={{ width: 50, height: 12, borderRadius: 6, background: '#1e1e32' }} />
                ))}
              </div>
            </div>
          ))}
          <style>{`@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
        </div>
      )}

      {/* ── LIVE NOW tab ─────────────────────────────────────────── */}
      {!loading && activeTab === 'live' && (
        <AnimatePresence mode="wait">
          <motion.div
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {liveStreams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b6b8a' }}>
                <Radio size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontSize: 15, fontWeight: 600 }}>No one is live right now.</p>
                <p style={{ fontSize: 13, marginTop: 6 }}>Check back soon or start your own stream!</p>
                {currentUser && (
                  <button
                    onClick={() => router.push('/live/go-live')}
                    style={{
                      marginTop: 16, padding: '10px 24px', borderRadius: 12,
                      background: 'linear-gradient(135deg,#ef4444,#f97316)', color: '#fff',
                      fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                    }}
                  >
                    🔴 Go Live Now
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {liveStreams.map(stream => (
                  <LiveStreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── CREATORS tab ─────────────────────────────────────────── */}
      {!loading && activeTab === 'creators' && (
        <AnimatePresence mode="wait">
          <motion.div
            key="creators"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {creators.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b6b8a' }}>
                <Crown size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontSize: 15, fontWeight: 600 }}>No creators yet.</p>
              </div>
            ) : (
              creators.map(creator => (
                <CreatorCard key={creator.id} creator={creator} />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── FOLLOWING empty state ─────────────────────────────────── */}
      {!loading && activeTab === 'following' && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b6b8a' }}>
          <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>
            {currentUser ? "You're not following anyone yet." : 'Sign in to see posts from people you follow.'}
          </p>
          {!currentUser && (
            <button
              onClick={() => router.push('/signup')}
              style={{
                marginTop: 16, padding: '10px 24px', borderRadius: 12,
                background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff',
                fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
              }}
            >
              Join Anoni
            </button>
          )}
        </div>
      )}

      {/* ── POSTS feed ───────────────────────────────────────────── */}
      {!loading && isPostTab && posts.length > 0 && (
        <AnimatePresence mode="popLayout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* ── Load more trigger / spinner ──────────────────────────── */}
      <div ref={bottomRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
        {loadingMore && (
          <div style={{
            width: 24, height: 24, border: '2px solid #7c3aed',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        )}
        {!hasMore && !loading && posts.length > 0 && isPostTab && (
          <p style={{ color: '#3d3d5c', fontSize: 12 }}>You&apos;ve seen everything 👻</p>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
