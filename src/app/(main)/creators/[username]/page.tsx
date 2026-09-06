'use client'

import { use } from 'react'
import { Radio, Star, Lock } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Link from 'next/link'

const mockCreators: Record<string, {
  username: string; alias: string; bio: string; isLive: boolean;
  subscribers: number; posts: number; price: string
}> = {
  LunaPlayz: { username: 'LunaPlayz', alias: 'Nova66', bio: 'Late night vibes & anonymous confessions 🌙', isLive: true, subscribers: 1204, posts: 87, price: '₦1,500/mo' },
  Mystic44:  { username: 'Mystic44',  alias: 'Ghost44', bio: 'Hidden truths, raw thoughts 🌀', isLive: true, subscribers: 892, posts: 54, price: '₦2,000/mo' },
  Venom21:   { username: 'Venom21',   alias: 'Shadow27', bio: 'Just here for the chaos 🔥', isLive: false, subscribers: 443, posts: 31, price: '₦500/mo' },
}

export default function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const creator = mockCreators[username]

  if (!creator) {
    return (
      <div className="w-full max-w-[640px] mx-auto py-12 px-4 text-center">
        <p className="text-text-muted">Creator not found.</p>
        <Link href="/creators" className="text-primary text-sm mt-2 inline-block">← Back to creators</Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[640px] mx-auto py-6 px-4">
      {/* Header */}
      <div className="bg-bg-card border border-border rounded-3xl p-6 mb-4">
        <div className="flex items-start gap-4">
          <Avatar name={creator.username} src={null} size={72} isLive={creator.isLive} />
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold">{creator.username}</h1>
            <p className="text-text-muted text-sm">@{creator.alias}</p>
            <p className="text-text-secondary text-sm mt-2">{creator.bio}</p>
          </div>
        </div>

        <div className="flex gap-6 mt-5 pt-5 border-t border-border">
          <div className="text-center">
            <p className="text-white font-bold">{creator.subscribers.toLocaleString()}</p>
            <p className="text-text-muted text-xs">Subscribers</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{creator.posts}</p>
            <p className="text-text-muted text-xs">Posts</p>
          </div>
          {creator.isLive && (
            <div className="flex items-center gap-1 text-live text-sm font-bold">
              <Radio size={14} /> LIVE
            </div>
          )}
        </div>

        <button className="w-full mt-5 bg-purple-gradient text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <Star size={16} /> Subscribe · {creator.price}
        </button>
      </div>

      {/* Locked content preview */}
      <div className="space-y-3">
        <h3 className="text-white font-semibold">Premium Content</h3>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center">
              <Lock size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="h-3 bg-bg-elevated rounded-full w-3/4 mb-2" />
              <div className="h-2.5 bg-bg-elevated rounded-full w-1/2" />
            </div>
            <span className="text-primary text-xs font-bold">Unlock</span>
          </div>
        ))}
      </div>
    </div>
  )
}
