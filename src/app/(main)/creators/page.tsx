'use client'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { Star } from 'lucide-react'

export default function CreatorsPage() {
  const creators = [
    { username: 'LunaPlayz', alias: 'Nova66', avatar: null, isLive: true },
    { username: 'Mystic44', alias: 'Ghost44', avatar: null, isLive: true },
    { username: 'Venom21', alias: 'Shadow27', avatar: null, isLive: false },
  ]

  return (
    <div className="w-full max-w-[800px] mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Star className="text-primary" /> Top Creators
        </h1>
        <p className="text-[#6b6b8a] text-sm">Find and subscribe to premium content.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {creators.map(c => (
          <Link key={c.username} href={`/creators/${c.username}`}>
            <div className="bg-[#12121d] border border-[#1e1e32] rounded-2xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
              <Avatar name={c.username} src={c.avatar} size={56} isLive={c.isLive} />
              <div>
                <h3 className="text-white font-bold">{c.username}</h3>
                <p className="text-[#6b6b8a] text-sm">@{c.alias}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
