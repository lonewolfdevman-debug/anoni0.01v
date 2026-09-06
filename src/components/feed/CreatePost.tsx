'use client'
import { useState, useRef, useCallback } from 'react'
import { Image as ImageIcon, Video, Mic, Radio, Eye, EyeOff, ChevronDown } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface CreatePostProps {
  onPost?: () => void
}

type MediaType = 'photo' | 'video' | 'audio' | 'text'

export default function CreatePost({ onPost }: CreatePostProps) {
  const { currentUser, isAnonymousMode } = useAppStore()
  const [caption, setCaption] = useState('')
  const [posting, setPosting] = useState(false)
  const [anonymous, setAnonymous] = useState(isAnonymousMode)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<MediaType>('text')
  const [uploading, setUploading] = useState(false)
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'premium' | 'subscribers'>('public')
  const [showVisibility, setShowVisibility] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const alias = currentUser?.anonymous_alias || 'Anon'
  const displayName = anonymous ? alias : (currentUser?.display_name || 'User')

  const pickFile = (type: MediaType, ref: React.RefObject<HTMLInputElement | null>) => {
    setMediaType(type)
    ref.current?.click()
    setExpanded(true)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType('text')
  }

  const uploadMedia = async (file: File, type: MediaType): Promise<string | null> => {
    const bucket = type === 'photo' ? 'photos' : type === 'video' ? 'videos' : 'audio'
    const ext = file.name.split('.').pop()
    const path = `${currentUser!.id}/${Date.now()}.${ext}`
    const { error, data } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return urlData.publicUrl
  }

  const handlePost = async () => {
    if (!currentUser || (!caption.trim() && !mediaFile)) return
    setPosting(true)
    try {
      let media_url: string | null = null
      if (mediaFile) {
        setUploading(true)
        media_url = await uploadMedia(mediaFile, mediaType)
        setUploading(false)
      }

      const { error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        post_type: mediaType,
        caption: caption.trim() || null,
        media_url,
        visibility,
        is_anonymous: anonymous,
      } as any)
      if (error) throw error
      setCaption('')
      removeMedia()
      setExpanded(false)
      toast.success(anonymous ? '👻 Posted anonymously!' : '🚀 Posted!')
      onPost?.()
    } catch (err) {
      console.error('CreatePost error:', err)
      toast.error('Failed to post. Try again.')
    } finally {
      setPosting(false)
      setUploading(false)
    }
  }

  const visibilityLabels = { public: '🌍 Everyone', followers: '👥 Followers', premium: '⭐ Premium', subscribers: '💎 Subscribers' }
  const canPost = !posting && (caption.trim().length > 0 || !!mediaFile)

  return (
    <div style={{ background: '#12121d', border: '1px solid #1e1e32', borderRadius: 20, overflow: 'hidden' }}>

      {/* Hidden file inputs */}
      <input ref={photoRef} type="file" className="hidden" accept="image/*" onChange={onFileChange} />
      <input ref={videoRef} type="file" className="hidden" accept="video/*" onChange={onFileChange} />
      <input ref={audioRef} type="file" className="hidden" accept="audio/*" onChange={onFileChange} />

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Avatar
            src={anonymous ? null : currentUser?.profile_picture}
            name={displayName}
            size={42}
          />
          <div style={{ flex: 1 }}>
            <textarea
              value={caption}
              onChange={e => { setCaption(e.target.value); if (!expanded) setExpanded(true) }}
              onFocus={() => setExpanded(true)}
              placeholder={`What's on your mind, ${displayName}?`}
              style={{
                width: '100%', background: 'transparent', color: '#fff',
                fontSize: 14, lineHeight: 1.6, resize: 'none', outline: 'none',
                fontFamily: 'inherit', minHeight: expanded ? 80 : 40,
                transition: 'min-height 0.2s',
              }}
              className="placeholder-[#6b6b8a]"
              rows={expanded ? 3 : 1}
            />

            {/* Media preview */}
            <AnimatePresence>
              {mediaPreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'relative', marginTop: 10, borderRadius: 12, overflow: 'hidden' }}
                >
                  {mediaType === 'photo' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaPreview} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }} />
                  )}
                  {mediaType === 'video' && (
                    <video src={mediaPreview} controls style={{ width: '100%', maxHeight: 200, borderRadius: 12 }} />
                  )}
                  {mediaType === 'audio' && (
                    <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 12 }}>
                      <audio src={mediaPreview} controls style={{ width: '100%' }} />
                    </div>
                  )}
                  <button
                    onClick={removeMedia}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.7)', color: '#fff',
                      borderRadius: '50%', width: 24, height: 24,
                      border: 'none', cursor: 'pointer', fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2,
        padding: '10px 16px', borderTop: '1px solid #1a1a2e',
        background: '#0f0f1a',
      }}>
        {/* Media Buttons */}
        <button
          onClick={() => pickFile('photo', photoRef)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, color: '#7c3aed', fontSize: 12, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}
          title="Photo"
        >
          <ImageIcon size={15} /> Photo
        </button>
        <button
          onClick={() => pickFile('video', videoRef)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, color: '#a855f7', fontSize: 12, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}
          title="Video"
        >
          <Video size={15} /> Video
        </button>
        <button
          onClick={() => pickFile('audio', audioRef)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, color: '#ec4899', fontSize: 12, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}
          title="Voice Note"
        >
          <Mic size={15} /> Voice Note
        </button>
        <button
          onClick={() => router.push('/live/go-live')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, color: '#ef4444', fontSize: 12, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}
          title="Go Live"
        >
          <Radio size={15} /> Go Live
        </button>

        <div style={{ flex: 1 }} />

        {/* Visibility Picker */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowVisibility(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
              borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#a1a1b5',
              border: '1px solid #1e1e32', background: '#14141f', cursor: 'pointer',
            }}
          >
            {visibilityLabels[visibility]} <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {showVisibility && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', bottom: '110%', right: 0,
                  background: '#14141f', border: '1px solid #1e1e32',
                  borderRadius: 12, overflow: 'hidden', zIndex: 50, minWidth: 150,
                }}
              >
                {(Object.keys(visibilityLabels) as Array<keyof typeof visibilityLabels>).map(v => (
                  <button key={v}
                    onClick={() => { setVisibility(v); setShowVisibility(false) }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 14px', fontSize: 12, fontWeight: 600,
                      color: visibility === v ? '#a855f7' : '#a1a1b5',
                      background: visibility === v ? 'rgba(124,58,237,0.1)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    {visibilityLabels[v]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Anonymous toggle */}
        <button
          onClick={() => setAnonymous(a => !a)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
            borderRadius: 8, fontSize: 11, fontWeight: 600,
            border: `1px solid ${anonymous ? 'rgba(124,58,237,0.4)' : '#1e1e32'}`,
            background: anonymous ? 'rgba(124,58,237,0.15)' : 'transparent',
            color: anonymous ? '#a855f7' : '#6b6b8a', cursor: 'pointer',
          }}
        >
          {anonymous ? <EyeOff size={13} /> : <Eye size={13} />}
          {anonymous ? 'Anonymous' : 'Public'}
        </button>

        {/* Post button */}
        <AnimatePresence>
          {canPost && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              onClick={handlePost}
              disabled={posting}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 18px',
                borderRadius: 10, border: 'none', cursor: 'pointer', opacity: posting ? 0.7 : 1,
              }}
            >
              {uploading ? 'Uploading...' : posting ? 'Posting...' : 'Post'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
