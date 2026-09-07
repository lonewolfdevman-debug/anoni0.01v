import { create } from 'zustand'

export interface AppUser {
  id: string
  username: string
  display_name: string
  email?: string
  bio?: string | null
  profile_picture?: string | null
  is_creator?: boolean
  is_verified?: boolean
  is_live?: boolean
  wallet_balance?: number
  anonymous_alias?: string
  premium_status?: boolean
  reveal_price?: number
}

interface AppStore {
  currentUser: AppUser | null
  isAnonymous: boolean
  isAnonymousMode: boolean
  notificationCount: number
  messageCount: number
  setCurrentUser: (user: AppUser | null) => void
  setIsAnonymous: (val: boolean) => void
  toggleAnonymousMode: () => void
  setNotificationCount: (count: number) => void
  setMessageCount: (count: number) => void
  updateWalletBalance: (amount: number) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentUser: null,
  isAnonymous: false,
  isAnonymousMode: false,
  notificationCount: 0,
  messageCount: 0,

  setCurrentUser: (user) => set({ currentUser: user }),

  setIsAnonymous: (val) => set({ isAnonymous: val, isAnonymousMode: val }),

  toggleAnonymousMode: () =>
    set((state) => ({
      isAnonymousMode: !state.isAnonymousMode,
      isAnonymous: !state.isAnonymousMode,
    })),

  setNotificationCount: (count) => set({ notificationCount: count }),

  setMessageCount: (count) => set({ messageCount: count }),

  updateWalletBalance: (amount) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, wallet_balance: (state.currentUser.wallet_balance ?? 0) + amount }
        : null,
    })),
}))
