'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, MessageSquare, DollarSign, Eye, EyeOff, ShieldAlert, Heart, ImageIcon, Video, Mic, Radio, Award } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import TipModal from '@/components/wallet/TipModal'
import RevealModal from '@/components/wallet/RevealModal'
import PostCard from '@/components/feed/PostCard'
import SubscribeButton from '@/components/creator/SubscribeButton'
import toast from 'react-hot-toast'

interface ProfileUser {
  id: string
  username: string
  display_name: string
  email: string
  profile_picture: string | null
  bio: string | null
  wallet_balance: number
  premium_status: boolean
  anonymous_alias: string
  reveal_price: number
  is_creator: boolean
  is_verified: boolean
  is_live: boolean
}

export default function UserProfilePage({ params }: { params: { username: string } }) {
  const router = useRouter()
  const { currentUser } = useAppStore()
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isTipOpen, setIsTipOpen] = useState(false)
  const [isRevealOpen, setIsRevealOpen] = useState(false)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [followersCount, setFollowersCount] = useState(0)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', params.username)
          .single()

        if (error || !user) {
          toast.error('User not found')
          router.push('/')
          return
        }

        const u = user as any

        // Redirect to own profile if it matches currentUser
        if (currentUser && currentUser.id === u.id) {
          router.push('/profile')
          return
        }

        setProfileUser(u)

        // Check if following
        if (currentUser) {
          const { data: followRecord } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', u.id)
            .single()
          setIsFollowing(!!followRecord)

          // Check if identity is revealed
          const { data: revealRecord } = await supabase
            .from('identity_reveals')
            .select('*')
            .eq('buyer_id', currentUser.id)
            .eq('target_id', u.id)
            .single()
          setIsRevealed(!!revealRecord)
        }

        // Get followers count
        const { count } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', u.id)
        setFollowersCount(count || 0)

        // Fetch user posts
        const { data: posts } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', u.id)
          .eq('is_anonymous', false) // Obeying normal profile visibility rules
          .order('created_at', { ascending: false })
        if (posts) setUserPosts(posts)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [params.username, currentUser, router])

  const handleFollowToggle = async () => {
    if (!currentUser || !profileUser) {
      toast.error('Sign in to follow creators')
      return
    }

    try {
      if (isFollowing) {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileUser.id)
        setIsFollowing(false)
        setFollowersCount(prev => Math.max(0, prev - 1))
        toast.success(`Unfollowed @${profileUser.username}`)
      } else {
        await supabase.from('followers').insert({
          follower_id: currentUser.id,
          following_id: profileUser.id,
        } as any)
        setIsFollowing(true)
        setFollowersCount(prev => prev + 1)
        toast.success(`Followed @${profileUser.username}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleMessage = async () => {
    if (!currentUser || !profileUser) return
    try {
      // Find or create conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user_one.eq.${currentUser.id},user_two.eq.${profileUser.id}),and(user_one.eq.${profileUser.id},user_two.eq.${currentUser.id})`)
        .single()

      if (existing) {
        const ex = existing as any
        router.push(`/messages?id=${ex.id}`)
      } else {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            user_one: currentUser.id,
            user_two: profileUser.id,
          } as any)
          .select('id')
          .single()
        const nc = newConv as any
        if (nc) router.push(`/messages?id=${nc.id}`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Could not open chat')
    }
  }

  if (loading) {
    return (
      <div className="min-height-[100vh] flex flex-col items-center justify-center gap-4 py-20">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-[#6b6b8a] text-sm">Loading profile...</span>
      </div>
    )
  }

  if (!profileUser) return null

  // Obfuscate public profile unless revealed or target has set reveal price to 0
  const displayedName = isRevealed ? profileUser.display_name : profileUser.anonymous_alias
  const displayedUsername = isRevealed ? `@${profileUser.username}` : `@${profileUser.anonymous_alias.toLowerCase()}`

  return (
    <div className="w-full max-w-[720px] mx-auto py-6 px-4 space-y-6">
      
      {/* Profile Header */}
      <div className="bg-[#12121d] border border-[#1e1e32] rounded-3xl overflow-hidden relative">
        <div className="h-40 bg-gradient-to-r from-primary/80 to-purple-600 relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="p-6 relative -mt-16">
          <div className="flex items-end justify-between mb-4">
            <div className="relative">
              <Avatar
                src={isRevealed ? profileUser.profile_picture : null}
                name={displayedName}
                size={88}
                isPremium={profileUser.premium_status}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleFollowToggle}
                className={`px-5 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  isFollowing 
                    ? 'bg-[#14141f] border-[#1e1e32] text-white hover:bg-[#1a1a2e]' 
                    : 'bg-primary border-primary text-white hover:bg-primary-hover'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button 
                onClick={handleMessage}
                className="w-10 h-10 bg-[#14141f] border border-[#1e1e32] text-white rounded-xl flex items-center justify-center hover:bg-[#1a1a2e] transition-colors"
                title="Message"
              >
                <MessageSquare size={18} />
              </button>
              <button 
                onClick={() => setIsTipOpen(true)}
                className="w-10 h-10 bg-[#14141f] border border-[#1e1e32] text-white rounded-xl flex items-center justify-center hover:bg-[#1a1a2e] transition-colors"
                title="Tip User"
              >
                <DollarSign size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-white font-extrabold text-2xl">{displayedName}</h2>
              {profileUser.is_verified && <CheckCircle2 size={18} className="text-primary fill-primary/20" />}
              {profileUser.premium_status && <Award size={18} className="text-[#f59e0b]" />}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6b6b8a]">
              <span>{displayedUsername}</span>
              {profileUser.is_creator && (
                <>
                  <span>•</span>
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Creator
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Bio (obfuscated if not revealed) */}
          <p className="text-[#a1a1b5] text-sm mt-3 leading-relaxed">
            {isRevealed ? (profileUser.bio || 'No bio yet.') : '🔒 Bio is hidden. Purchase identity reveal to unlock.'}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#1e1e32] text-center">
            <div>
              <p className="text-white font-bold text-lg">{userPosts.length}</p>
              <p className="text-[#6b6b8a] text-xs font-medium uppercase tracking-wider">Posts</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{followersCount}</p>
              <p className="text-[#6b6b8a] text-xs font-medium uppercase tracking-wider">Followers</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{profileUser.is_creator ? 'Premium' : 'Standard'}</p>
              <p className="text-[#6b6b8a] text-xs font-medium uppercase tracking-wider">Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Identity Reveal & Subscriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reveal Card */}
        <div className="bg-[#12121d] border border-[#1e1e32] rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2">
              {isRevealed ? <Eye size={18} /> : <EyeOff size={18} />}
              Identity Reveal
            </div>
            {isRevealed ? (
              <p className="text-sm text-green-500 font-bold">Successfully unlocked public details!</p>
            ) : (
              <>
                <p className="text-white font-extrabold text-lg">@{profileUser.anonymous_alias}</p>
                <p className="text-xs text-[#6b6b8a] mt-1.5 leading-relaxed">
                  Reveal this user's real public username, display name, profile avatar, and full profile details.
                </p>
              </>
            )}
          </div>
          {!isRevealed && (
            <div className="mt-4 pt-4 border-t border-[#1e1e32] flex items-center justify-between">
              <div>
                <span className="text-[#6b6b8a] text-[10px] uppercase font-bold tracking-wider block">Price</span>
                <span className="text-white font-extrabold text-base">{formatNaira(profileUser.reveal_price)}</span>
              </div>
              <button 
                onClick={() => setIsRevealOpen(true)}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                Reveal Identity
              </button>
            </div>
          )}
        </div>

        {/* Creator Subscription Card */}
        {profileUser.is_creator && (
          <div className="bg-[#12121d] border border-[#1e1e32] rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <div className="text-xs text-[#f59e0b] font-bold flex items-center gap-2 mb-2">
                💎 Creator Subscription
              </div>
              <p className="text-white font-extrabold text-lg">Support {displayedName}</p>
              <p className="text-xs text-[#6b6b8a] mt-1.5">Get access to premium subscribers-only media, livestreams, and special perks.</p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#1e1e32] w-full">
              <SubscribeButton price={500} creatorName={displayedName} />
            </div>
          </div>
        )}
      </div>

      {/* Feed Section */}
      <div className="space-y-4">
        <h3 className="text-white font-bold text-lg mb-3">Posts</h3>
        {userPosts.length > 0 ? (
          userPosts.map(post => (
            <PostCard key={post.id} post={{...post, user: profileUser}} />
          ))
        ) : (
          <div className="py-20 text-center bg-[#12121d] border border-[#1e1e32] rounded-3xl">
            <p className="text-[#6b6b8a] text-sm">No public posts yet from this user.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isTipOpen && (
          <TipModal
            recipientId={profileUser.id}
            recipientAlias={displayedName}
            onClose={() => setIsTipOpen(false)}
          />
        )}
        {isRevealOpen && (
          <RevealModal
            targetUserId={profileUser.id}
            targetUserAlias={profileUser.anonymous_alias}
            revealPrice={profileUser.reveal_price}
            onClose={() => setIsRevealOpen(false)}
            onSuccess={() => setIsRevealed(true)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
