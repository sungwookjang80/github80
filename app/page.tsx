export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: conversations }, { data: topics }] = await Promise.all([
    supabase.from('conversations').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(3),
    supabase.from('topics').select('*').eq('user_id', user.id).order('count', { ascending: false }).limit(6),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="font-bold text-gray-900">AI 학습 플랫폼</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/chat" className="text-indigo-600 hover:text-indigo-800 font-medium">AI 튜터</Link>
          <Link href="/profile" className="text-gray-600 hover:text-gray-900">내 학습</Link>
        </nav>
      </header>
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-indigo-600 text-white rounded-2xl p-6">
          <p className="text-indigo-200 text-sm mb-1">안녕하세요!</p>
          <h2 className="text-xl font-bold">오늘도 탐구를 시작해볼까요?</h2>
          <Link href="/chat" className="mt-4 inline-block bg-white text-indigo-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-50">
            AI 튜터와 대화하기 →
          </Link>
        </div>

        {conversations && conversations.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">최근 대화</h3>
            <div className="space-y-2">
              {conversations.map(conv => (
                <Link key={conv.id} href={`/chat/${conv.id}`}
                  className="block p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 text-sm">
                  <span className="font-medium text-gray-900">{conv.title}</span>
                  <span className="text-gray-400 text-xs ml-2">{new Date(conv.updated_at).toLocaleDateString('ko-KR')}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {topics && topics.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">내가 탐구 중인 주제</h3>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic: { id: string; tag: string; count: number }) => (
                <span key={topic.id} className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-xs font-medium">
                  {topic.tag} <span className="text-indigo-400">({topic.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
