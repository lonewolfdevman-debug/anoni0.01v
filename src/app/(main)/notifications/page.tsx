'use client'

import { useState } from 'react'
import { Bell, Heart, MessageCircle, UserPlus, Star, EyeOff } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { formatDistanceToNow } from 'date-fns'

type NotifType = 'like' | 'comment' | 'follow' | 'mention' | 'tip'

interface Notif {
  id: string
  type: NotifType
  actor: string
  isAnon: boolean
  text: string
  time: Date
  read: boolean
}

const mockNotifs: Notif[] = [
  { id: '1', type: 'like', actor: 'Ghost44', isAnon: false, text: 'liked your post', time: new Date(Date.now() - 1000 * 60 * 5), read: false },
  { id: '2', type: 'follow', actor: 'Anonymous', isAnon: true, text: 'started following you', time: new Date(Date.now() - 1000 * 60 * 30), read: false },
  { id: '3', type: 'comment', actor: 'Nova66', isAnon: false, text: 'commented on your post', time: new Date(Date.now() - 1000 * 60 * 60 * 2), read: true },
  { id: '4', type: 'tip', actor: 'Shadow27', isAnon: false, text: 'sent you a tip 💜', time: new Date(Date.now() - 1000 * 60 * 60 * 5), read: true },
  { id: '5', type: 'mention', actor: 'Anonymous', isAnon: true, text: 'mentioned you in a post', time: new Date(Date.now() - 1000 * 60 * 60 * 24), read: true },
]

const iconMap = {
  like: <Heart size={14} className="text-pink-DEFAULT" />,
  comment: <MessageCircle size={14} className="text-primary" />,
  follow: <UserPlus size={14} className="text-success" />,
  mention: <Bell size={14} className="text-gold" />,
  tip: <Star size={14} className="text-gold" />,
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>(mockNotifs)

  const markAllRead = () => setNotifs((n: Notif[]) => n.map(x => ({ ...x, read: true })))
  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div className="w-full max-w-[640px] mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell className="text-primary" /> Notifications
          {unreadCount > 0 && (
            <span className="text-xs bg-primary text-white rounded-full px-2 py-0.5 font-bold">{unreadCount}</span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary hover:opacity-80 font-semibold">
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-1">
        {notifs.map(n => (
          <div
            key={n.id}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors ${
              !n.read ? 'bg-bg-card border border-border' : 'hover:bg-bg-surface'
            }`}
          >
            <div className="relative">
              <Avatar name={n.isAnon ? '?' : n.actor} size={40} src={null} />
              <span className="absolute -bottom-0.5 -right-0.5 bg-bg-base rounded-full p-0.5">
                {iconMap[n.type]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">
                {n.isAnon ? (
                  <span className="font-semibold text-text-secondary flex items-center gap-1 inline-flex">
                    <EyeOff size={12} /> Anonymous
                  </span>
                ) : (
                  <span className="font-semibold">{n.actor}</span>
                )}{' '}
                {n.text}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {formatDistanceToNow(n.time, { addSuffix: true })}
              </p>
            </div>
            {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}
