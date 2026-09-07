// Database row types matching Supabase schema

export interface UserRow {
  id: string
  username: string
  display_name: string
  bio: string | null
  profile_picture: string | null
  is_creator: boolean
  is_verified: boolean
  wallet_balance: number
  anonymous_alias: string | null
  subscription_price: number | null
  created_at: string
}

export interface PostRow {
  id: string
  user_id: string
  caption: string | null
  media_url: string | null
  media_type: 'photo' | 'video' | 'audio' | null
  is_anonymous: boolean
  visibility: 'public' | 'followers' | 'subscribers' | 'private'
  reveal_price: number | null
  like_count: number
  comment_count: number
  created_at: string
  // joined
  user?: UserRow
  liked_by_me?: boolean
  saved_by_me?: boolean
}

export interface LivestreamRow {
  id: string
  host_id: string
  title: string
  livekit_room: string
  is_anonymous: boolean
  viewer_count: number
  is_active: boolean
  started_at: string
  // joined
  host?: UserRow
}

export interface CreatorProfile extends UserRow {
  subscriber_count: number
  post_count: number
  is_subscribed_by_me?: boolean
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
