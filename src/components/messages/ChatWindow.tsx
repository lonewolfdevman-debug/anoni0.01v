'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import Avatar from '@/components/ui/Avatar'
import { timeAgo, formatNaira } from '@/lib/utils'
import {
  Send, Image as ImageIcon, Video, Mic, MicOff, StopCircle,
  Play, Pause, Eye, EyeOff, MoreVertical, Phone, Video as VideoIcon,
  Check, CheckCheck, X, Smile, Ghost
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MessageWithSender, ConversationWithUsers } from '@/types/messaging'
import type { UserRow } from '@/types/database'
import toast from 'react-hot-toast'

interface ChatWindowProps {
  conversation: ConversationWithUsers
  onClose?: () => void
}

type RecordingState = 'idle' | 'recording' | 'recorded'

export default function ChatWindow({ conversation, onClose }: ChatWindowProps) {
  const { currentUser } = useAppStore()
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const bottomRef = useRef<HTMLDivElement>(null)
  const filePhotoRef = useRef<HTMLInputElement>(null)
  const fileVideoRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())

  const other = conversation.other_user

  /* ─── Load messages ─────────────────────────────────────────── */
  const fetchMessages = useCallback(async (pageNum: number) => {
    if (!currentUser) return
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(*)')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .range(pageNum * 30, pageNum * 30 + 29)

    if (!error && data) {
      const msgs = (data as unknown as MessageWithSender[]).reverse()
      setMessages(prev => pageNum === 0 ? msgs : [...msgs, ...prev])
      setHasMore(data.length === 30)
    }
    setLoading(false)
  }, [conversation.id, currentUser])

  useEffect(() => {
    setMessages([])
    setPage(0)
    setLoading(true)
    fetchMessages(0)
  }, [conversation.id, fetchMessages])

  /* ─── Scroll to bottom on new messages ──────────────────────── */
  useEffect(() => {
    if (page === 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, page])

  /* ─── Realtime new messages ──────────────────────────────────── */
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, async payload => {
        const newMsg = payload.new as any
        if (newMsg.sender_id === currentUser?.id) return // Already added optimistically
        // Fetch with sender join
        const { data } = await supabase
          .from('messages')
          .select('*, sender:users!messages_sender_id_fkey(*)')
          .eq('id', newMsg.id)
          .single()
        if (data) setMessages(prev => [...prev, data as unknown as MessageWithSender])
        // Mark as read
        await supabase.from('messages').update({ read: true }).eq('id', newMsg.id)
      })
      // Typing indicator via broadcast
      .on('broadcast', { event: 'typing' }, payload => {
        if (payload.payload.userId !== currentUser?.id) {
          setOtherTyping(true)
          clearTimeout(typingTimerRef.current!)
          typingTimerRef.current = setTimeout(() => setOtherTyping(false), 3000)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversation.id, currentUser])

  /* ─── Typing indicator ───────────────────────────────────────── */
  const broadcastTyping = useCallback(() => {
    supabase.channel(`chat-${conversation.id}`).send({
      type: 'broadcast', event: 'typing',
      payload: { userId: currentUser?.id, alias: currentUser?.anonymous_alias },
    })
  }, [conversation.id, currentUser])

  const handleTextChange = (val: string) => {
    setText(val)
    if (!isTyping) { setIsTyping(true); broadcastTyping() }
    clearTimeout(typingTimerRef.current!)
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 2000)
  }

  /* ─── Upload media ───────────────────────────────────────────── */
  const uploadToChat = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'bin'
    const path = `${currentUser!.id}/${conversation.id}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('chat_media').upload(path, file, { upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('chat_media').getPublicUrl(data.path)
    return urlData.publicUrl
  }

  /* ─── Send message ───────────────────────────────────────────── */
  const sendMessage = async (
    type: 'text' | 'photo' | 'video' | 'voice_note' = 'text',
    content?: string,
    mediaUrl?: string
  ) => {
    if (!currentUser) return
    if (type === 'text' && !content?.trim()) return

    setSending(true)
    try {
      const payload = {
        conversation_id: conversation.id,
        sender_id: currentUser.id,
        message_type: type,
        content: content?.trim() || null,
        media_url: mediaUrl || null,
        read: false,
      }

      // Optimistic insert
      const optimistic: MessageWithSender = {
        ...payload,
        id: `optimistic-${Date.now()}`,
        created_at: new Date().toISOString(),
        sender: currentUser as unknown as UserRow,
      }
      setMessages(prev => [...prev, optimistic])
      setText('')
      setAudioBlob(null)
      setRecordingState('idle')

      const { data, error } = await supabase.from('messages').insert(payload).select('*, sender:users!messages_sender_id_fkey(*)').single()
      if (error) throw error

      // Replace optimistic
      setMessages(prev => prev.map(m => m.id === optimistic.id ? (data as unknown as MessageWithSender) : m))

      // Update conversation last message
      await supabase.from('conversations').update({
        last_message: type === 'text' ? (content?.substring(0, 100) || '') : `📎 ${type}`,
        last_message_at: new Date().toISOString(),
      }).eq('id', conversation.id)

    } catch {
      toast.error('Failed to send message')
      setMessages(prev => prev.filter(m => !m.id.startsWith('optimistic-')))
    } finally {
      setSending(false)
    }
  }

  const handleSendText = () => sendMessage('text', text)

  const handleFileUpload = async (file: File, type: 'photo' | 'video') => {
    try {
      toast.loading('Uploading...', { id: 'upload' })
      const url = await uploadToChat(file)
      toast.dismiss('upload')
      await sendMessage(type, undefined, url)
    } catch {
      toast.error('Upload failed')
      toast.dismiss('upload')
    }
  }

  /* ─── Voice recording ────────────────────────────────────────── */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setRecordingState('recorded')
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      setRecordingState('recording')
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime((t: number) => t + 1), 1000)
    } catch {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    clearInterval(timerRef.current!)
  }

  const cancelRecording = () => {
    mediaRecorderRef.current?.stop()
    clearInterval(timerRef.current!)
    setAudioBlob(null)
    setRecordingState('idle')
    setRecordingTime(0)
    audioChunksRef.current = []
  }

  const sendVoiceNote = async () => {
    if (!audioBlob) return
    try {
      toast.loading('Sending voice note...', { id: 'voice' })
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
      const url = await uploadToChat(file)
      toast.dismiss('voice')
      await sendMessage('voice_note', undefined, url)
    } catch {
      toast.error('Failed to send voice note')
      toast.dismiss('voice')
    }
  }

  const toggleAudio = (msgId: string, url: string) => {
    if (playingMsgId === msgId) {
      audioRefs.current.get(msgId)?.pause()
      setPlayingMsgId(null)
    } else {
      if (playingMsgId) {
        audioRefs.current.get(playingMsgId)?.pause()
      }
      let audio = audioRefs.current.get(msgId)
      if (!audio) {
        audio = new Audio(url)
        audio.onended = () => setPlayingMsgId(null)
        audioRefs.current.set(msgId, audio)
      }
      audio.play()
      setPlayingMsgId(msgId)
    }
  }

  const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const isMine = (msg: MessageWithSender) => msg.sender_id === currentUser?.id

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#090910' }}>

      {/* Hidden file inputs */}
      <input ref={filePhotoRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'photo'); e.target.value = '' }} />
      <input ref={fileVideoRef} type="file" accept="video/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'video'); e.target.value = '' }} />

      {/* Chat header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #1e1e32',
        background: '#0f0f1a', display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        {onClose && (
          <button onClick={onClose} style={{ color: '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        )}
        <Avatar src={other?.profile_picture} name={other?.display_name || 'User'} size={40} isLive={other?.is_live} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
              {other?.anonymous_alias}
            </span>
            {other?.is_verified && (
              <span style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={8} style={{ color: '#fff' }} />
              </span>
            )}
          </div>
          <p style={{ color: otherTyping ? '#a855f7' : '#6b6b8a', fontSize: 11, marginTop: 2 }}>
            {otherTyping ? 'typing...' : other?.is_live ? '🔴 Live now' : `@${other?.username}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{ color: '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
            <Phone size={17} />
          </button>
          <button style={{ color: '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
            <VideoIcon size={17} />
          </button>
          <button style={{ color: '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
            <MoreVertical size={17} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', scrollbarWidth: 'thin' }}>
        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <button
              onClick={() => { const next = page + 1; setPage(next); fetchMessages(next) }}
              style={{ color: '#6b6b8a', fontSize: 12, border: 'none', background: 'none', cursor: 'pointer' }}
            >
              Load earlier messages
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <div style={{ width: 24, height: 24, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((msg, i) => {
              const mine = isMine(msg)
              const prevMsg = messages[i - 1]
              const showAvatar = !mine && (!prevMsg || prevMsg.sender_id !== msg.sender_id)

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    justifyContent: mine ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: 8,
                  }}
                >
                  {/* Other user avatar */}
                  {!mine && (
                    <div style={{ width: 28, flexShrink: 0 }}>
                      {showAvatar && (
                        <Avatar src={msg.sender?.profile_picture} name={msg.sender?.anonymous_alias || 'User'} size={28} />
                      )}
                    </div>
                  )}

                  <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                    {/* Photo */}
                    {msg.message_type === 'photo' && msg.media_url && (
                      <div style={{ borderRadius: 16, overflow: 'hidden', maxWidth: 260 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.media_url} alt="Photo" loading="lazy"
                          style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
                      </div>
                    )}

                    {/* Video */}
                    {msg.message_type === 'video' && msg.media_url && (
                      <div style={{ borderRadius: 16, overflow: 'hidden', maxWidth: 260 }}>
                        <video src={msg.media_url} controls style={{ width: '100%', display: 'block' }} />
                      </div>
                    )}

                    {/* Voice note */}
                    {msg.message_type === 'voice_note' && msg.media_url && (
                      <div style={{
                        background: mine ? 'linear-gradient(135deg,#5b21b6,#7c3aed)' : '#1a1a2e',
                        borderRadius: 20, padding: '10px 14px',
                        display: 'flex', alignItems: 'center', gap: 10, minWidth: 180,
                      }}>
                        <button
                          onClick={() => toggleAudio(msg.id, msg.media_url!)}
                          style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: mine ? 'rgba(255,255,255,0.2)' : '#7c3aed',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {playingMsgId === msg.id
                            ? <Pause size={13} fill="white" style={{ color: 'white' }} />
                            : <Play size={13} fill="white" style={{ color: 'white', marginLeft: 2 }} />
                          }
                        </button>
                        {/* Waveform */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, height: 24 }}>
                          {Array.from({ length: 24 }).map((_, j) => (
                            <div key={j} style={{
                              flex: 1, borderRadius: 2,
                              height: `${25 + Math.abs(Math.sin(j * 0.8) * 60)}%`,
                              background: mine ? 'rgba(255,255,255,0.5)' : '#7c3aed',
                            }} />
                          ))}
                        </div>
                        <span style={{ color: mine ? 'rgba(255,255,255,0.7)' : '#6b6b8a', fontSize: 10 }}>
                          🎤
                        </span>
                      </div>
                    )}

                    {/* Text bubble */}
                    {msg.message_type === 'text' && msg.content && (
                      <div style={{
                        background: mine ? 'linear-gradient(135deg,#5b21b6,#7c3aed)' : '#1a1a2e',
                        color: '#fff', fontSize: 14, lineHeight: 1.55,
                        padding: '10px 14px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        wordBreak: 'break-word',
                      }}>
                        {msg.content}
                      </div>
                    )}

                    {/* Timestamp + read receipt */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <span style={{ color: '#3d3d5c', fontSize: 10 }}>{timeAgo(msg.created_at)}</span>
                      {mine && (
                        msg.read
                          ? <CheckCheck size={12} style={{ color: '#7c3aed' }} />
                          : <Check size={12} style={{ color: '#3d3d5c' }} />
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* Typing indicator */}
            {otherTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar src={other?.profile_picture} name={other?.display_name || 'User'} size={28} />
                <div style={{ background: '#1a1a2e', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#6b6b8a',
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input area ───────────────────────────────────────────── */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid #1e1e32',
        background: '#0f0f1a', flexShrink: 0,
      }}>

        {/* Voice note recorded preview */}
        <AnimatePresence>
          {recordingState === 'recorded' && audioBlob && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: '#14141f', border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 12, padding: '10px 12px', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ec4899', flexShrink: 0 }} />
              <span style={{ color: '#a1a1b5', fontSize: 12, flex: 1 }}>Voice note ready to send</span>
              <button onClick={cancelRecording} style={{ color: '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={14} />
              </button>
              <button
                onClick={sendVoiceNote}
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff',
                  padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                }}
              >
                Send
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording indicator */}
        {recordingState === 'recording' && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'livePulse 1s ease-in-out infinite' }} />
            <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 600 }}>Recording... {fmtSecs(recordingTime)}</span>
            <div style={{ flex: 1 }} />
            <button onClick={cancelRecording} style={{ color: '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer' }}>
              <X size={14} />
            </button>
            <button
              onClick={stopRecording}
              style={{
                background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer',
                padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <StopCircle size={13} /> Stop
            </button>
          </div>
        )}
        <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          {/* Anonymous toggle */}
          <button
            onClick={() => setAnonymous((a: boolean) => !a)}
            title={anonymous ? 'Sending as alias' : 'Sending as you'}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: anonymous ? 'rgba(124,58,237,0.2)' : '#14141f',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              color: anonymous ? '#a855f7' : '#6b6b8a',
            }}
          >
            {anonymous ? <Ghost size={16} /> : <EyeOff size={16} />}
          </button>

          {/* Text input */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'flex-end',
            background: '#14141f', borderRadius: 16, border: '1px solid #1e1e32',
            padding: '8px 12px', gap: 8, minHeight: 42,
          }}>
            <textarea
              value={text}
              onChange={e => handleTextChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText() }
              }}
              placeholder={anonymous ? `Message as ${currentUser?.anonymous_alias}...` : 'Type a message...'}
              rows={1}
              style={{
                flex: 1, background: 'transparent', color: '#fff', fontSize: 14,
                border: 'none', outline: 'none', resize: 'none',
                maxHeight: 100, overflowY: 'auto', lineHeight: 1.5,
                fontFamily: 'inherit',
              }}
              className="placeholder-[#6b6b8a]"
            />

            {/* Media attach buttons */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
              <button
                onClick={() => filePhotoRef.current?.click()}
                style={{ color: '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer', padding: 3, borderRadius: 6 }}
              >
                <ImageIcon size={17} />
              </button>
              <button
                onClick={() => fileVideoRef.current?.click()}
                style={{ color: '#6b6b8a', border: 'none', background: 'none', cursor: 'pointer', padding: 3, borderRadius: 6 }}
              >
                <Video size={17} />
              </button>
            </div>
          </div>

          {/* Voice note OR send button */}
          {text.trim() ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSendText}
              disabled={sending}
              style={{
                width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Send size={17} style={{ color: '#fff' }} />
            </motion.button>
          ) : recordingState === 'idle' ? (
            <button
              onMouseDown={startRecording}
              style={{
                width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: '#14141f', border: '1px solid #1e1e32',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6b8a',
              }}
            >
              <Mic size={17} />
            </button>
          ) : null}
        </div>

        {/* Anonymous mode label */}
        {anonymous && (
          <p style={{ color: '#a855f7', fontSize: 10, fontWeight: 600, marginTop: 6, marginLeft: 4 }}>
            👻 Sending as {currentUser?.anonymous_alias}
          </p>
        )}
      </div>
    </div>
  )
}
