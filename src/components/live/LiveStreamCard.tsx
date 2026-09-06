'use client'
import { motion } from 'framer-motion'
import Avatar from '@/components/ui/Avatar'
import { useRouter } from 'next/navigation'
import { Radio, Eye } from 'lucide-react'
import type { LivestreamRow, UserRow } from '@/types/database'

interface LiveStreamCardProps {
  stream: LivestreamRow & { creator?: UserRow }
}

export default function LiveStreamCard({ stream }: LiveStreamCardProps) {
  const router = useRouter()

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => router.push(`/live/${stream.room_name}`)}
      style={{
        background: '#12121d', border: '1px solid #1e1e32', borderRadius: 20,
        overflow: 'hidden', cursor: 'pointer', position: 'relative',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a1a2e, #0f0f1a)' }}>
        {stream.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stream.thumbnail_url}
            alt={stream.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))',
          }}>
            <Radio size={36} style={{ color: 'rgba(124,58,237,0.5)' }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)',
        }} />

        {/* LIVE badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800,
          padding: '3px 8px', borderRadius: 6, letterSpacing: '0.05em',
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 0 12px rgba(239,68,68,0.6)',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: '#fff',
            animation: 'livePulse 1.2s ease-in-out infinite',
            display: 'inline-block',
          }} />
          LIVE
        </div>
        <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

        {/* Viewer count */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 600,
          padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4,
          backdropFilter: 'blur(4px)',
        }}>
          <Eye size={11} /> {stream.viewer_count.toLocaleString()}
        </div>

        {/* Creator info at bottom of thumbnail */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Avatar
            src={stream.creator?.profile_picture ?? null}
            name={stream.creator?.anonymous_alias ?? 'Creator'}
            size={28}
          />
          <div>
            <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>
              {stream.creator?.anonymous_alias ?? 'Anonymous'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, lineHeight: 1.2, marginTop: 2 }}>
              {stream.title}
            </p>
          </div>
          {stream.is_subscriber_only && (
            <span style={{
              marginLeft: 'auto', background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
              color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
            }}>
              SUBS ONLY
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
