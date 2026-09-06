'use client'
import { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import { useAppStore } from '@/store/useAppStore'
import { useRouter } from 'next/navigation'
import { Crown, Users, Check } from 'lucide-react'
import { formatNaira } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { UserRow, CreatorProfile } from '@/types/database'

interface CreatorCardProps {
  creator: UserRow & { creator_profile?: CreatorProfile; is_following?: boolean; is_subscribed?: boolean }
  onSubscribe?: (creatorId: string) => void
}

export default function CreatorCard({ creator, onSubscribe }: CreatorCardProps) {
  const { currentUser } = useAppStore()
  const router = useRouter()
  const [subscribed, setSubscribed] = useState(creator.is_subscribed ?? false)
  const [following, setFollowing] = useState(creator.is_following ?? false)

  const price = creator.creator_profile?.monthly_price ?? 500
  const subscribers = creator.creator_profile?.total_subscribers ?? 0

  const handleSubscribe = () => {
    if (!currentUser) { router.push('/signup'); return }
    setSubscribed(s => !s)
    toast.success(subscribed ? 'Unsubscribed' : `💎 Subscribed to ${creator.anonymous_alias}!`)
    onSubscribe?.(creator.id)
  }

  return (
    <div style={{
      background: '#12121d', border: '1px solid #1e1e32', borderRadius: 20,
      padding: 20, display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <Avatar src={creator.profile_picture} name={creator.display_name} size={52} isLive={creator.is_live} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{creator.anonymous_alias}</span>
          {creator.is_verified && (
            <span style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: '50%', width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={8} style={{ color: '#fff' }} />
            </span>
          )}
          <Crown size={12} style={{ color: '#f59e0b' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ color: '#6b6b8a', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Users size={10} /> {subscribers.toLocaleString()} subscribers
          </span>
          <span style={{ color: '#a855f7', fontSize: 11, fontWeight: 700 }}>
            {formatNaira(price)}/mo
          </span>
        </div>
      </div>

      <button
        onClick={handleSubscribe}
        style={{
          flexShrink: 0,
          padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 700,
          border: 'none', cursor: 'pointer',
          background: subscribed
            ? 'rgba(124,58,237,0.15)'
            : 'linear-gradient(135deg,#7c3aed,#a855f7)',
          color: subscribed ? '#a855f7' : '#fff',
          transition: 'all 0.2s',
        }}
      >
        {subscribed ? '✓ Subscribed' : 'Subscribe'}
      </button>
    </div>
  )
}
