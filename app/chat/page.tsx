'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Conversation } from '@/types'

export default function ChatListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setConversations(data) })
  }, [])

  async function startNew() {
    const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '새 대화' }) })
    const conv = await res.json()
    router.push(`/chat/${conv.id}`)
  }

  return (
    <div className="min-h-screen bg-nomad-bg">
      <header className="bg-white border-b border-sand-100 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm">← 홈</Link>
        <h1 className="font-bold text-gray-900">AI 튜터</h1>
        <button onClick={startNew} className="bg-sand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sand-700">
          새 대화
        </button>
      </header>
      <main className="max-w-2xl mx-auto p-6">
        {conversations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>아직 대화가 없습니다.</p>
            <p className="text-sm mt-1">위 버튼을 눌러 첫 대화를 시작해보세요.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <Link key={conv.id} href={`/chat/${conv.id}`}
                className="block p-4 bg-white border border-sand-100 rounded-xl hover:border-sand-300 hover:bg-sand-50 transition-colors">
                <p className="font-medium text-gray-900 text-sm">{conv.title}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(conv.updated_at).toLocaleDateString('ko-KR')}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
