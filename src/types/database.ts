// Database row types matching Supabase schema

export interface UserRow {
  id: string
  email?: string
  username: string
  display_name: string
  bio: string | null
  profile_picture: string | null
  is_creator: boolean
  is_verified: boolean
  is_live?: boolean
  wallet_balance: number
  anonymous_alias: string | null
  subscription_price?: number | null
  reveal_price?: number | null
  premium_status?: boolean
  created_at: string
}

export interface PostRow {
  id: string
  user_id: string
  post_type?: 'photo' | 'video' | 'audio' | 'text' | null
  caption: string | null
  media_url: string | null
  thumbnail_url?: string | null
  duration?: number | null
  media_type?: 'photo' | 'video' | 'audio' | null
  is_anonymous: boolean
  visibility: 'public' | 'followers' | 'subscribers' | 'premium' | 'private'
  reveal_price?: number | null
  like_count: number
  comment_count: number
  share_count?: number
  created_at: string
  // joined
  user?: UserRow
  is_liked?: boolean
  is_bookmarked?: boolean
  liked_by_me?: boolean
  saved_by_me?: boolean
}

export interface LivestreamRow {
  id: string
  host_id?: string
  creator_id?: string
  room_name?: string
  title: string
  status?: string
  livekit_room?: string
  thumbnail_url?: string | null
  is_anonymous?: boolean
  is_subscriber_only?: boolean
  viewer_count: number
  is_active?: boolean
  started_at?: string
  ended_at?: string | null
  created_at?: string
  // joined
  host?: UserRow
  creator?: UserRow
}

export interface CreatorProfile {
  id?: string
  user_id?: string
  monthly_price?: number
  creator_description?: string
  total_subscribers?: number
  total_earnings?: number
  subscriber_count?: number
  post_count?: number
  is_subscribed_by_me?: boolean
  created_at?: string
}

export interface CommentRow {
  id: string
  post_id: string
  user_id: string
  content: string
  is_anonymous: boolean
  created_at: string
  user?: UserRow
}

export interface NotificationRow {
  id: string
  user_id: string
  actor_id: string | null
  type: 'like' | 'comment' | 'follow' | 'tip' | 'mention' | 'subscription'
  entity_id: string | null
  is_anonymous: boolean
  read: boolean
  created_at: string
  actor?: UserRow
}
