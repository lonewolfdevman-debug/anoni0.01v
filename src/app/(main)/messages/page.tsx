'use client'
import { useState, useEffect } from 'react'
import ConversationList from '@/components/messages/ConversationList'
import ChatWindow from '@/components/messages/ChatWindow'
import type { ConversationWithUsers } from '@/types/messaging'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'

export default function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState<ConversationWithUsers | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { currentUser } = useAppStore()

  const queryConvId = searchParams.get('id')

  useEffect(() => {
    if (!queryConvId || !currentUser) return

    const loadConv = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, user_one_data:users!conversations_user_one_fkey(*), user_two_data:users!conversations_user_two_fkey(*)')
        .eq('id', queryConvId)
        .single()

      if (!error && data) {
        const d = data as any
        const conv: ConversationWithUsers = {
          ...d,
          other_user: d.user_one === currentUser.id ? d.user_two_data : d.user_one_data,
        }
        setSelectedConv(conv)
      }
    }

    loadConv()
  }, [queryConvId, currentUser])

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-[calc(100vh-0px)] -mt-14 lg:mt-0 pt-14 lg:pt-0 bg-[#090910]">
      {/* List - hidden on mobile if a chat is selected */}
      <div className={`h-full ${selectedConv ? 'hidden lg:block' : 'block w-full lg:w-auto'}`}>
        <ConversationList
          activeConvId={selectedConv?.id || null}
          onSelectConv={setSelectedConv}
          onNewChat={() => {}}
        />
      </div>

      {/* Chat Window - hidden on mobile if no chat is selected */}
      <div className={`flex-1 h-full ${selectedConv ? 'block' : 'hidden lg:flex lg:items-center lg:justify-center'}`}>
        {selectedConv ? (
          <ChatWindow
            conversation={selectedConv}
            onClose={() => {
              setSelectedConv(null)
              router.push('/messages')
            }}
          />
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-[#14141f] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#1e1e32]">
              <span className="text-[#6b6b8a] text-2xl">💬</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Your Messages</h3>
            <p className="text-[#6b6b8a] text-sm">Select a conversation or search users to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  )
}
