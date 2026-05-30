export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('demo-user')?.value === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isDemo) redirect('/login')

  const topics = isDemo || !user ? [] : (
    await supabase.from('topics').select('*').eq('user_id', user.id).order('count', { ascending: false })
  ).data ?? []

  const convCount = isDemo || !user ? 0 : (
    await supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  ).count ?? 0

  const msgCount = isDemo || !user ? 0 : (
    await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('role', 'user')
  ).count ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm">← 홈</Link>
        <h1 className="font-bold text-gray-900">내 학습 현황</h1>
        <div />
      </header>
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {isDemo && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            데모 모드에서는 학습 이력이 저장되지 않습니다.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">{convCount}</p>
            <p className="text-sm text-gray-500 mt-1">총 대화 수</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">{msgCount}</p>
            <p className="text-sm text-gray-500 mt-1">보낸 메시지</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">탐구한 주제</h3>
          {topics.length > 0 ? (
            <div className="space-y-3">
              {topics.map((topic: { id: string; tag: string; count: number }) => (
                <div key={topic.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{topic.tag}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${Math.min((topic.count / (topics[0]?.count || 1)) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{topic.count}회</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">AI 튜터와 대화하면 주제가 자동으로 분석됩니다.</p>
          )}
        </div>

        <Link href="/chat" className="block text-center bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700">
          AI 튜터와 대화 계속하기
        </Link>
      </main>
    </div>
  )
}
