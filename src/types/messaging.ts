import type { UserRow } from '@/types/database'

export type ChatTab = 'all' | 'primary' | 'requests' | 'groups' | 'premium'

export type MessageType = 'text' | 'photo' | 'video' | 'voice_note' | 'tip'

export interface MessageWithSender {
  id: string
  conversation_id: string
  sender_id: string
  type: MessageType
  content?: string
  media_url?: string
  is_anonymous: boolean
  read: boolean
  created_at: string
  sender?: UserRow
  reveal_price?: number
  is_revealed?: boolean
}

export interface ConversationWithUsers {
  id: string
  user_one: string
  user_two: string
  last_message?: string | null
  last_message_at?: string | null
  created_at: string
  unread_count?: number
  user_one_data?: UserRow
  user_two_data?: UserRow
  other_user?: UserRow & { is_live?: boolean }
}
