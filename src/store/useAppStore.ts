import { create } from 'zustand'

export interface AppUser {
  id: string
  username: string
  display_name: string
  bio?: string
  profile_picture?: string | null
  is_creator?: boolean
  wallet_balance?: number
  anonymous_alias?: string
}

interface AppStore {
  currentUser: AppUser | null
  isAnonymous: boolean
  setCurrentUser: (user: AppUser | null) => void
  setIsAnonymous: (val: boolean) => void
  updateWalletBalance: (amount: number) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentUser: null,
  isAnonymous: false,

  setCurrentUser: (user) => set({ currentUser: user }),

  setIsAnonymous: (val) => set({ isAnonymous: val }),

  updateWalletBalance: (amount) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, wallet_balance: (state.currentUser.wallet_balance ?? 0) + amount }
        : null,
    })),
}))
