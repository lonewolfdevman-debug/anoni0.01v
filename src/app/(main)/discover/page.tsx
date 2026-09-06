'use client'
import { useState } from 'react'
import { Search, Hash, Users, MapPin, TrendingUp } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Link from 'next/link'

export default function DiscoverPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'groups' | 'tags'>('all')

  const trendingTags = ['#anonymous', '#gaming', '#music', '#late-night', '#tech']

  const suggestedUsers = [
    { username: 'Phantom11', alias: 'Ghost44', avatar: null, isLive: false },
    { username: 'Echo33', alias: 'Unknown', avatar: null, isLive: false },
    { username: 'Blaze77', alias: 'Fire99', avatar: null, isLive: true },
  ]

  return (
    <div className="w-full max-w-[800px] mx-auto py-6 px-4">
      {/* Search Header */}
      <div className="mb-6">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6b8a]" />
          <input
            type="text"
            placeholder="Search users, aliases, groups..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#12121d] border border-[#1e1e32] rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/60 transition-colors shadow-card"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(['all', 'users', 'groups', 'tags'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-[#14141f] text-[#6b6b8a] hover:text-white border border-[#1e1e32]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Suggested Users */}
          <div className="bg-[#12121d] border border-[#1e1e32] rounded-3xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Users size={18} className="text-primary" /> Suggested for you
            </h3>
            <div className="space-y-4">
              {suggestedUsers.map(u => (
                <div key={u.username} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.username} size={40} isLive={u.isLive} />
                    <div>
                      <p className="text-white font-semibold text-sm">{u.username}</p>
                      <p className="text-[#6b6b8a] text-xs">@{u.alias}</p>
                    </div>
                  </div>
                  <button className="bg-[#14141f] border border-[#1e1e32] text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-[#1a1a2e] transition-colors">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Trending Tags */}
          <div className="bg-[#12121d] border border-[#1e1e32] rounded-3xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" /> Trending Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map(tag => (
                <Link key={tag} href={`/discover?q=${encodeURIComponent(tag)}`}>
                  <span className="bg-[#14141f] border border-[#1e1e32] text-[#a1a1b5] text-xs px-3 py-1.5 rounded-lg hover:text-white hover:border-primary/50 transition-colors inline-block">
                    {tag}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
