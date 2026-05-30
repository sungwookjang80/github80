import { Suspense } from 'react'
import ChatWindow from '@/components/chat/ChatWindow'
import Link from 'next/link'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let title = 'AI 튜터'
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data } = await supabase
        .from('conversations')
        .select('title')
        .eq('id', id)
        .single()
      if (data?.title) title = data.title
    }
  } catch {}

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-sand-100 bg-white">
        <Link href="/chat" className="text-gray-500 hover:text-gray-900 text-sm shrink-0 transition-colors">
          ← 목록
        </Link>
        <span className="text-gray-200">|</span>
        <span className="text-sm font-semibold text-gray-800 truncate flex-1 min-w-0">{title}</span>
        <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm shrink-0 transition-colors">홈</Link>
      </header>
      <div className="flex-1 overflow-hidden">
        <Suspense>
          <ChatWindow conversationId={id} />
        </Suspense>
      </div>
    </div>
  )
}
