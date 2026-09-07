'use client'
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  Play, Pause, LogIn, Send, X, ChevronDown, Check
} from 'lucide-react'
import { formatCount, timeAgo } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { PostRow, UserRow } from '@/types/database'

interface PostCardProps {
  post: (PostRow | any) & { user?: any; is_liked?: boolean; is_bookmarked?: boolean }
  onLike?: (postId: string, liked: boolean) => void
}

type CommentWithUser = {
  id: string
  content: string
  is_anonymous: boolean
  created_at: string
  user?: any
}

export default function PostCard({ post, onLike }: PostCardProps) {
  const { currentUser } = useAppStore()
  const router = useRouter()
  const [liked, setLiked] = useState<boolean>(Boolean(post.is_liked))
  const [likeCount, setLikeCount] = useState<number>(post.like_count ?? 0)
  const [bookmarked, setBookmarked] = useState<boolean>(Boolean(post.is_bookmarked))
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false)
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false)
  const [showComments, setShowComments] = useState<boolean>(false)
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [commentText, setCommentText] = useState<string>('')
  const [loadingComments, setLoadingComments] = useState<boolean>(false)
  const [submittingComment, setSubmittingComment] = useState<boolean>(false)
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false)
  const [shareCount, setShareCount] = useState<number>(post.share_count ?? 0)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const isAnonymous = post.is_anonymous
  const displayName = isAnonymous ? post.user?.anonymous_alias : (post.user?.display_name || post.user?.username || 'User')
  const avatarSrc = isAnonymous ? null : post.user?.profile_picture

  const requireAuth = useCallback((action: () => void) => {
    if (!currentUser) { setShowAuthModal(true); return }
    action()
  }, [currentUser])

  const handleLike = () => requireAuth(async () => {
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount((c: number) => newLiked ? c + 1 : c - 1)
    if (newLiked) {
      await (supabase.from('post_likes') as any).insert({ post_id: post.id, user_id: currentUser!.id })
    } else {
      await (supabase.from('post_likes') as any).delete().match({ post_id: post.id, user_id: currentUser!.id })
    }
    onLike?.(post.id, newLiked)
  })

  const handleBookmark = () => requireAuth(() => {
    setBookmarked((b: boolean) => !b)
    toast.success(bookmarked ? 'Removed from bookmarks' : '🔖 Bookmarked!')
  })

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const { data } = await (supabase
        .from('post_comments') as any)
        .select('*, user:users(*)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: false })
        .limit(30)
      setComments((data || []) as unknown as CommentWithUser[])
    } finally {
      setLoadingComments(false)
    }
  }

  const toggleComments = () => {
    const next = !showComments
    setShowComments(next)
    if (next && comments.length === 0) loadComments()
  }

  const submitComment = () => requireAuth(async () => {
    if (!commentText.trim()) return
    setSubmittingComment(true)
    try {
      const { data, error } = await (supabase
        .from('post_comments') as any)
        .insert({
          post_id: post.id,
          user_id: currentUser!.id,
          content: commentText.trim(),
          is_anonymous: false,
        })
        .select('*, user:users(*)')
        .single()
      if (error) throw error
      setComments((c: CommentWithUser[]) => [data as unknown as CommentWithUser, ...c])
      setCommentText('')
      toast.success('Comment posted!')
    } catch {
      toast.error('Failed to comment')
    } finally {
      setSubmittingComment(false)
    }
  })

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`
    if (navigator.share) {
      await navigator.share({ title: `@${post.user?.anonymous_alias}`, text: post.caption || '', url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
    setShareCount((s: number) => s + 1)
    await (supabase.from('posts') as any).update({ share_count: shareCount + 1 }).eq('id', post.id)
    setShowShareMenu(false)
  }

  const toggleVideo = () => {
    if (!videoRef.current) return
    if (videoPlaying) { videoRef.current.pause() } else { videoRef.current.play() }
    setVideoPlaying(!videoPlaying)
  }

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (audioPlaying) { audioRef.current.pause() } else { audioRef.current.play() }
    setAudioPlaying(!audioPlaying)
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: '#12121d', border: '1px solid #1e1e32', borderRadius: 20, overflow: 'hidden', position: 'relative' }}
      >
        {/* Post Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <Avatar src={avatarSrc} name={displayName || 'User'} size={42} isLive={!isAnonymous && post.user?.is_live} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{displayName}</span>
                {post.user?.is_verified && !isAnonymous && (
                  <span style={{
                    background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                    borderRadius: '50%', width: 14, height: 14, display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={8} style={{ color: '#fff' }} />
                  </span>
                )}
                {post.user?.is_creator && !isAnonymous && (
                  <span style={{ fontSize: 9, color: '#a855f7', fontWeight: 700, background: 'rgba(168,85,247,0.12)', padding: '2px 7px', borderRadius: 6 }}>
                    CREATOR
                  </span>
                )}
                {isAnonymous && (
                  <span style={{ fontSize: 10, color: '#6b6b8a', background: '#1a1a2e', padding: '2px 7px', borderRadius: 6 }}>
                    👻 Anonymous
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ color: '#6b6b8a', fontSize: 11 }}>{timeAgo(post.created_at)}</span>
                {!isAnonymous && (
                  <>
                    <span style={{ color: '#3d3d5c', fontSize: 11 }}>·</span>
                    <span style={{ color: 'rgba(168,85,247,0.6)', fontSize: 11 }}>
                      {post.user?.anonymous_alias}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button style={{ color: '#3d3d5c', padding: 6, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }}>
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <div style={{ padding: '0 16px 12px', color: '#e2e2f0', fontSize: 14, lineHeight: 1.65 }}>
            {post.caption}
          </div>
        )}

        {/* Video */}
        {post.post_type === 'video' && post.media_url && (
          <div style={{ position: 'relative', background: '#000', cursor: 'pointer' }} onClick={toggleVideo}>
            <video
              ref={videoRef}
              src={post.media_url}
              poster={post.thumbnail_url || undefined}
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }}
              onEnded={() => setVideoPlaying(false)}
              preload="metadata"
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />
            {!videoPlaying && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}>
                  <Play size={22} fill="white" style={{ color: 'white', marginLeft: 3 }} />
                </div>
              </div>
            )}
            {videoPlaying && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '3px 6px',
              }}>
                <Pause size={12} style={{ color: '#fff' }} />
              </div>
            )}
            {post.duration && (
              <span style={{
                position: 'absolute', bottom: 10, right: 10,
                background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 11, padding: '2px 7px', borderRadius: 4,
              }}>
                {Math.floor(post.duration / 60)}:{String(post.duration % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        )}

        {/* Photo */}
        {post.post_type === 'photo' && post.media_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.media_url}
            alt={post.caption || 'Post image'}
            loading="lazy"
            style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }}
          />
        )}

        {/* Audio / Voice Note */}
        {post.post_type === 'audio' && (
          <div style={{ margin: '0 14px 12px', background: '#14141f', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={toggleAudio}
                style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {audioPlaying
                  ? <Pause size={14} fill="white" style={{ color: 'white' }} />
                  : <Play size={14} fill="white" style={{ color: 'white', marginLeft: 2 }} />
                }
              </button>
              {/* Waveform bars */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: 34 }}>
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1, borderRadius: 2,
                    height: `${20 + Math.abs(Math.sin(i * 0.7 + 1) * 55)}%`,
                    background: audioPlaying && i < 12 ? '#a855f7' : (i < 12 ? '#7c3aed' : '#2a2a45'),
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
              {post.media_url && <audio ref={audioRef} src={post.media_url} onEnded={() => setAudioPlaying(false)} />}
              <span style={{ color: '#6b6b8a', fontSize: 11, flexShrink: 0 }}>
                {post.duration ? `${Math.floor(post.duration / 60)}:${String(post.duration % 60).padStart(2, '0')}` : '0:30'}
              </span>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '10px 16px 12px',
          borderTop: '1px solid rgba(30,30,50,0.7)', gap: 4,
        }}>
          {/* Like */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleLike}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600,
              color: liked ? '#ec4899' : '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer',
              padding: '6px 10px', borderRadius: 8, transition: 'color 0.15s',
            }}
          >
            <Heart size={17} fill={liked ? '#ec4899' : 'none'} />
            {formatCount(likeCount)}
          </motion.button>

          {/* Comment */}
          <button
            onClick={toggleComments}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600,
              color: showComments ? '#7c3aed' : '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer',
              padding: '6px 10px', borderRadius: 8,
            }}
          >
            <MessageCircle size={17} />
            {formatCount(post.comment_count)}
          </button>

          {/* Share */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowShareMenu((s: boolean) => !s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600,
                color: '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer',
                padding: '6px 10px', borderRadius: 8,
              }}
            >
              <Share2 size={17} />
              {formatCount(shareCount)}
            </button>
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', bottom: '110%', left: 0,
                    background: '#14141f', border: '1px solid #1e1e32',
                    borderRadius: 12, padding: 4, zIndex: 20, minWidth: 130,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                  }}
                >
                  <button
                    onClick={handleShare}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', fontSize: 12, color: '#e2e2f0', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }}
                  >
                    🔗 Copy Link
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`); toast.success('Copied!'); setShowShareMenu(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', fontSize: 12, color: '#e2e2f0', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }}
                  >
                    📋 Share Anonymously
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ flex: 1 }} />

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            style={{
              display: 'flex', alignItems: 'center', color: bookmarked ? '#f59e0b' : '#6b6b8a',
              border: 'none', background: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
            }}
          >
            <Bookmark size={17} fill={bookmarked ? '#f59e0b' : 'none'} />
          </button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ borderTop: '1px solid #1a1a2e', overflow: 'hidden' }}
            >
              <div style={{ padding: '12px 16px', maxHeight: 320, overflowY: 'auto', scrollbarWidth: 'thin' }}>

                {/* Comment input */}
                {currentUser ? (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                    <Avatar src={currentUser.profile_picture} name={currentUser.display_name} size={30} />
                    <div style={{
                      flex: 1, display: 'flex', gap: 8, alignItems: 'center',
                      background: '#14141f', borderRadius: 12, padding: '8px 12px',
                      border: '1px solid #1e1e32',
                    }}>
                      <input
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                        placeholder="Write a comment..."
                        style={{ flex: 1, background: 'transparent', color: '#fff', fontSize: 13, border: 'none', outline: 'none' }}
                        className="placeholder-[#6b6b8a]"
                      />
                      <button
                        onClick={submitComment}
                        disabled={!commentText.trim() || submittingComment}
                        style={{
                          color: commentText.trim() ? '#7c3aed' : '#3d3d5c',
                          border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                        }}
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => router.push('/login')}
                    style={{
                      width: '100%', padding: '10px', marginBottom: 12, borderRadius: 12,
                      background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                      color: '#a855f7', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <LogIn size={14} /> Sign in to comment
                  </button>
                )}

                {/* Comments list */}
                {loadingComments ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ width: 20, height: 20, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : comments.length === 0 ? (
                  <p style={{ color: '#6b6b8a', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                    No comments yet. Be the first!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {comments.map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                        <Avatar
                          src={c.is_anonymous ? null : c.user?.profile_picture}
                          name={c.is_anonymous ? c.user?.anonymous_alias : c.user?.display_name}
                          size={28}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                              {c.is_anonymous ? c.user?.anonymous_alias : c.user?.display_name}
                            </span>
                            <span style={{ color: '#3d3d5c', fontSize: 10 }}>{timeAgo(c.created_at)}</span>
                          </div>
                          <p style={{ color: '#c8c8e0', fontSize: 13, marginTop: 3, lineHeight: 1.5 }}>{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuthModal(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#14141f', border: '1px solid #1e1e32', borderRadius: 24,
                padding: 32, maxWidth: 360, width: '100%', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>👻</div>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Join Anoni</h3>
              <p style={{ color: '#6b6b8a', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Sign in or create an account to like, comment, and interact.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { router.push('/signup'); setShowAuthModal(false) }}
                  style={{
                    flex: 1, background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                    color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px',
                    borderRadius: 12, border: 'none', cursor: 'pointer',
                  }}
                >
                  Sign Up Free
                </button>
                <button
                  onClick={() => { router.push('/login'); setShowAuthModal(false) }}
                  style={{
                    flex: 1, background: '#1a1a2e', color: '#a1a1b5',
                    fontSize: 14, fontWeight: 600, padding: '12px',
                    borderRadius: 12, border: '1px solid #1e1e32', cursor: 'pointer',
                  }}
                >
                  Log In
                </button>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{ position: 'absolute', top: 16, right: 16, color: '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
