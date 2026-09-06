'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, CheckCircle2, Star, Eye, Image as ImageIcon, Video, Mic, Radio, Users, Heart, Edit3, Share2, Shield, Lock, Award, DollarSign } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import EditProfileModal from '@/components/profile/EditProfileModal'
import PostCard from '@/components/feed/PostCard'
import toast from 'react-hot-toast'

interface Post {
  id: string
  user_id: string
  post_type: 'photo' | 'video' | 'audio' | 'text'
  caption: string | null
  media_url: string | null
  thumbnail_url: string | null
  duration: number | null
  visibility: 'public' | 'followers' | 'premium' | 'subscribers'
  is_anonymous: boolean
  like_count: number
  comment_count: number
  share_count: number
  created_at: string
  user?: any
}

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useAppStore()
  const [activeTab, setActiveTab] = useState<'posts' | 'photos' | 'videos' | 'audio' | 'livestreams' | 'subscribers' | 'likes'>('posts')
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<any[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [subscribersCount, setSubscribersCount] = useState(0)
  const [revenue, setRevenue] = useState(0)
  
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    router.push('/login')
  }

  useEffect(() => {
    if (!currentUser) return

    const loadProfileData = async () => {
      setLoadingPosts(true)
      try {
        // Fetch posts
        const { data: posts } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
        if (posts) setUserPosts(posts)

        // Fetch liked posts
        const { data: likes } = await supabase
          .from('post_likes')
          .select('*, posts(*)')
          .eq('user_id', currentUser.id)
        if (likes) {
          const validLikes = likes.map((l: any) => l.posts).filter(Boolean)
          setLikedPosts(validLikes)
        }

        // Fetch followers
        const { count: followers } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', currentUser.id)
        setFollowersCount(followers || 0)

        // Fetch following
        const { count: following } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', currentUser.id)
        setFollowingCount(following || 0)

        // Fetch subscriptions/subscribers
        const { count: subs } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', currentUser.id)
          .eq('active', true)
        setSubscribersCount(subs || 0)

        const { data: creatorProfile } = await supabase
          .from('creator_profiles')
          .select('total_earnings')
          .eq('user_id', currentUser.id)
          .single()
        const cp = creatorProfile as any
        if (cp) {
          setRevenue(Number(cp.total_earnings) || 0)
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoadingPosts(false)
      }
    }

    loadProfileData()
  }, [currentUser])

  if (!currentUser) return null

  interface TabItem {
    id: 'posts' | 'photos' | 'videos' | 'audio' | 'livestreams' | 'subscribers' | 'likes'
    label: string
    icon: any
    ownerOnly?: boolean
  }

  const tabs: TabItem[] = [
    { id: 'posts', label: 'Posts', icon: Edit3 },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'audio', label: 'Audio', icon: Mic },
    { id: 'livestreams', label: 'Livestreams', icon: Radio },
    { id: 'subscribers', label: 'Subscribers', icon: Users, ownerOnly: true },
    { id: 'likes', label: 'Likes', icon: Heart },
  ]

  const photos = userPosts.filter(p => p.post_type === 'photo')
  const videos = userPosts.filter(p => p.post_type === 'video')
  const audio = userPosts.filter(p => p.post_type === 'audio')

  return (
    <div className="w-full max-w-[720px] mx-auto py-6 px-4 space-y-6">
      
      {/* Profile Header */}
      <div className="bg-[#12121d] border border-[#1e1e32] rounded-3xl overflow-hidden relative">
        {/* Cover Banner */}
        <div className="h-40 bg-gradient-to-r from-primary to-pink-500 relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* User Info Container */}
        <div className="p-6 relative -mt-16">
          <div className="flex items-end justify-between mb-4">
            <div className="relative">
              <Avatar
                src={currentUser.profile_picture}
                name={currentUser.display_name}
                size={88}
                isPremium={currentUser.premium_status}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditOpen(true)}
                className="bg-[#14141f] border border-[#1e1e32] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1a1a2e] transition-colors"
              >
                Edit Profile
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/profile/${currentUser.username}`)
                  toast.success('Profile link copied!')
                }}
                className="w-10 h-10 bg-[#14141f] border border-[#1e1e32] text-[#6b6b8a] rounded-xl flex items-center justify-center hover:text-white transition-colors"
                title="Share Profile"
              >
                <Share2 size={18} />
              </button>
              <button 
                onClick={handleLogout}
                className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-white font-extrabold text-2xl">{currentUser.display_name}</h2>
              {currentUser.is_verified && <CheckCircle2 size={18} className="text-primary fill-primary/20" />}
              {currentUser.premium_status && <Award size={18} className="text-[#f59e0b]" />}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6b6b8a]">
              <span>@{currentUser.username}</span>
              <span>•</span>
              <span className="text-primary font-medium">@{currentUser.anonymous_alias}</span>
              {currentUser.is_creator && (
                <>
                  <span>•</span>
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Creator
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {currentUser.bio ? (
            <p className="text-[#a1a1b5] text-sm mt-3 leading-relaxed whitespace-pre-wrap">
              {currentUser.bio}
            </p>
          ) : (
            <p className="text-[#6b6b8a] text-sm italic mt-3">No bio yet. Add one in Edit Profile.</p>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#1e1e32] text-center">
            <div>
              <p className="text-white font-bold text-lg">{userPosts.length}</p>
              <p className="text-[#6b6b8a] text-xs font-medium uppercase tracking-wider">Posts</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{followersCount}</p>
              <p className="text-[#6b6b8a] text-xs font-medium uppercase tracking-wider">Followers</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{followingCount}</p>
              <p className="text-[#6b6b8a] text-xs font-medium uppercase tracking-wider">Following</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{subscribersCount}</p>
              <p className="text-[#6b6b8a] text-xs font-medium uppercase tracking-wider">Subscribers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Dashboard & Identity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identity Reveal Card */}
        <div className="bg-[#12121d] border border-[#1e1e32] rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Shield size={18} className="text-primary" /> Identity Card
              </h3>
              <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                Active Alias
              </span>
            </div>
            <p className="text-white text-xl font-extrabold">{currentUser.anonymous_alias}</p>
            <p className="text-xs text-[#6b6b8a] mt-1.5 leading-relaxed">
              When using Anonymous mode, your posts will appear under this alias to hide your real identity.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e1e32] flex items-center justify-between">
            <div>
              <span className="text-[#6b6b8a] text-[10px] uppercase font-bold tracking-wider block">Reveal Price</span>
              <span className="text-white font-extrabold text-base">{formatNaira(currentUser.reveal_price)}</span>
            </div>
            <button 
              onClick={() => setIsEditOpen(true)}
              className="text-primary hover:text-primary-hover text-xs font-bold"
            >
              Change Price
            </button>
          </div>
        </div>

        {/* Creator Card */}
        {currentUser.is_creator && (
          <div className="bg-[#12121d] border border-[#1e1e32] rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <Star size={18} className="text-[#f59e0b]" /> Creator Stats
                </h3>
                <span className="text-[10px] font-bold text-[#f59e0b] uppercase bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">
                  Dashboard
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[#6b6b8a] text-[10px] uppercase font-bold tracking-wider">Total Earnings</span>
                  <span className="text-white font-extrabold text-lg block">{formatNaira(revenue)}</span>
                </div>
                <div>
                  <span className="text-[#6b6b8a] text-[10px] uppercase font-bold tracking-wider">Subs Revenue</span>
                  <span className="text-white font-extrabold text-lg block">{formatNaira(subscribersCount * 500)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#1e1e32] flex items-center justify-between text-xs text-[#6b6b8a]">
              <span>Basic tier: ₦500/month</span>
              <span className="text-green-500 font-bold">Active</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#1e1e32] overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          if (tab.ownerOnly && !currentUser.is_creator) return null
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-1.5 whitespace-nowrap ${
                isActive ? 'text-white' : 'text-[#6b6b8a] hover:text-[#a1a1b5]'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="profile-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-4">
        {loadingPosts ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[#6b6b8a] text-sm">Loading posts...</span>
          </div>
        ) : (
          <>
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              userPosts.length > 0 ? (
                userPosts.map(post => (
                  <PostCard key={post.id} post={{...post, user: currentUser}} />
                ))
              ) : (
                <div className="py-20 text-center">
                  <p className="text-[#6b6b8a] text-sm">No posts yet.</p>
                </div>
              )
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(post => (
                    <div key={post.id} className="aspect-square bg-[#14141f] rounded-xl border border-[#1e1e32] overflow-hidden group relative cursor-pointer" onClick={() => router.push('/')}>
                      <img src={post.media_url || ''} alt="Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-[#6b6b8a] text-sm">No photos uploaded yet.</p>
                </div>
              )
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && (
              videos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {videos.map(post => (
                    <div key={post.id} className="aspect-[9/16] bg-[#14141f] rounded-xl border border-[#1e1e32] overflow-hidden group relative cursor-pointer" onClick={() => router.push('/')}>
                      <video src={post.media_url || ''} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                        <span className="text-white text-xs font-bold flex items-center gap-1"><Eye size={12} /> {post.share_count * 10}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-[#6b6b8a] text-sm">No videos uploaded yet.</p>
                </div>
              )
            )}

            {/* Audio Tab */}
            {activeTab === 'audio' && (
              audio.length > 0 ? (
                <div className="space-y-3">
                  {audio.map(post => (
                    <div key={post.id} className="bg-[#12121d] border border-[#1e1e32] rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          <Mic size={18} />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{post.caption || 'Voice Note'}</p>
                          <p className="text-[#6b6b8a] text-xs">Duration: {post.duration || '0:12'}</p>
                        </div>
                      </div>
                      <audio src={post.media_url || ''} controls className="max-w-xs" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-[#6b6b8a] text-sm">No audio posts uploaded yet.</p>
                </div>
              )
            )}

            {/* Livestreams Tab */}
            {activeTab === 'livestreams' && (
              <div className="py-20 text-center space-y-2">
                <Radio size={32} className="text-[#6b6b8a] mx-auto mb-2" />
                <p className="text-white font-bold">No livestreams yet</p>
                <p className="text-[#6b6b8a] text-xs max-w-xs mx-auto">Go live to connect with your audience in real-time. Archived replays will show up here.</p>
              </div>
            )}

            {/* Subscribers Tab (Owner Only) */}
            {activeTab === 'subscribers' && (
              <div className="py-20 text-center space-y-2">
                <Users size={32} className="text-primary mx-auto mb-2" />
                <p className="text-white font-bold">Subscriber Analytics</p>
                <p className="text-[#6b6b8a] text-xs max-w-xs mx-auto">Manage subscriber access, rewards, and pricing structures directly from your Dashboard.</p>
              </div>
            )}

            {/* Likes Tab */}
            {activeTab === 'likes' && (
              likedPosts.length > 0 ? (
                likedPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="py-20 text-center">
                  <p className="text-[#6b6b8a] text-sm">No liked posts yet.</p>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

    </div>
  )
}
