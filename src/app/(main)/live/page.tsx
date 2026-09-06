'use client'

import { useState } from 'react'
import { Radio, Users, Eye } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Link from 'next/link'

const mockStreams = [
  { id: '1', username: 'LunaPlayz', alias: 'Nova66', avatar: null, title: 'Late night vibes 🌙', viewers: 142, isAnon: false },
  { id: '2', username: 'Ghost44', alias: 'Mystic44', avatar: null, title: 'anonymous confessions', viewers: 89, isAnon: true },
  { id: '3', username: 'Blaze77', alias: 'Fire99', avatar: null, title: 'gaming session 🎮', viewers: 213, isAnon: false },
]

export default function LivePage() {
  const [filter, setFilter] = useState<'all' | 'anonymous'>('all')

  const filtered = filter === 'anonymous' ? mockStreams.filter(s => s.isAnon) : mockStreams

  return (
    <div className="w-full max-w-[800px] mx-auto py-6 px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Radio className="text-live" /> Live Now
        </h1>
        <div className="flex gap-2">
          {(['all', 'anonymous'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filter === f ? 'bg-primary text-white' : 'bg-bg-elevated border border-border text-text-secondary hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(stream => (
          <Link key={stream.id} href={`/live/${stream.id}`}>
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors group">
              {/* Thumbnail */}
              <div className="aspect-video bg-bg-elevated relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center">
                  <Radio size={28} className="text-primary" />
                </div>
                <div className="absolute top-3 left-3 bg-live text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                </div>
                <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Eye size={11} /> {stream.viewers}
                </div>
              </div>
              {/* Info */}
              <div className="p-4 flex items-center gap-3">
                <Avatar
                  src={stream.isAnon ? null : stream.avatar}
                  name={stream.isAnon ? '?' : stream.username}
                  size={38}
                  isLive
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{stream.title}</p>
                  <p className="text-text-muted text-xs">
                    {stream.isAnon ? 'Anonymous' : `@${stream.alias}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-text-muted text-xs">
                  <Users size={12} /> {stream.viewers}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <Radio size={40} className="mx-auto mb-3 opacity-30" />
          <p>No live streams right now</p>
        </div>
      )}
    </div>
  )
}
