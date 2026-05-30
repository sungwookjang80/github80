import { Suspense } from 'react'
import ChatWindow from '@/components/chat/ChatWindow'
import Link from 'next/link'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-sand-100 bg-white">
        <Link href="/chat" className="text-gray-500 hover:text-gray-900 text-sm">← 목록</Link>
        <span className="text-gray-300">|</span>
        <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm">홈</Link>
      </header>
      <div className="flex-1 overflow-hidden">
        <Suspense>
          <ChatWindow conversationId={id} />
        </Suspense>
      </div>
    </div>
  )
}
