export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LearningInsight from '@/components/profile/LearningInsight'
import LogoutButton from '@/components/profile/LogoutButton'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('demo-user')?.value === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isDemo) redirect('/login')

  // 대화 목록 (최근 5개 + 전체 카운트)
  const { data: recentConvs, count: convCount } = isDemo || !user
    ? { data: [], count: 0 }
    : await supabase
        .from('conversations')
        .select('id, title, created_at, updated_at', { count: 'exact' })
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5)

  // 보낸 메시지 수
  let msgCount = 0
  if (!isDemo && user && (convCount ?? 0) > 0) {
    const { data: allConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
    const allIds = (allConvs ?? []).map(c => c.id)
    if (allIds.length > 0) {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', allIds)
        .eq('role', 'user')
      msgCount = count ?? 0
    }
  }

  // 탐구한 주제
  const { data: topics } = isDemo || !user
    ? { data: [] }
    : await supabase
        .from('topics')
        .select('*')
        .eq('user_id', user.id)
        .order('count', { ascending: false })
        .limit(8)

  // 레벨테스트 최신 결과
  const { data: latestAssessment } = isDemo || !user
    ? { data: null }
    : await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

  // 탐구 일수
  const activeDays = isDemo || !user ? 0 : (() => {
    const dates = new Set((recentConvs ?? []).map(c => new Date(c.created_at).toDateString()))
    return dates.size
  })()

  return (
    <div className="min-h-screen bg-nomad-bg">
      <header className="bg-white border-b border-sand-100 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm">← 홈</Link>
        <h1 className="font-bold text-gray-900">내 학습 현황</h1>
        {(user || isDemo) ? <LogoutButton isDemo={isDemo} /> : <div />}
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-5">
        {isDemo && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            데모 모드에서는 학습 이력이 저장되지 않습니다.
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: '총 대화', value: convCount ?? 0, emoji: '💬' },
            { label: '보낸 메시지', value: msgCount, emoji: '✉️' },
            { label: '탐구 주제', value: (topics ?? []).length, emoji: '🔍' },
            { label: '탐구 일수', value: activeDays, emoji: '📅' },
          ].map(({ label, value, emoji }) => (
            <div key={label} className="bg-white border border-sand-100 rounded-xl p-4 text-center">
              <p className="text-xl mb-1">{emoji}</p>
              <p className="text-2xl font-bold text-sand">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* 레벨테스트 결과 */}
        {latestAssessment ? (
          <div className="bg-white border border-sand-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">레벨 테스트 결과</h3>
              <Link href="/assessment" className="text-xs text-sand hover:underline">다시 테스트</Link>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sand-100 to-sand flex flex-col items-center justify-center shrink-0">
                <span className="text-2xl font-black text-white">{latestAssessment.level}</span>
                <span className="text-[10px] text-white/80">/ 10</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">{latestAssessment.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{latestAssessment.summary}</p>
              </div>
            </div>
            {latestAssessment.strengths?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1.5">강점</p>
                <div className="flex flex-wrap gap-1.5">
                  {latestAssessment.strengths.map((s: string, i: number) => (
                    <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {latestAssessment.growth_areas?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1.5">성장 포인트</p>
                <div className="flex flex-wrap gap-1.5">
                  {latestAssessment.growth_areas.map((g: string, i: number) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-sand-100 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">레벨 테스트를 아직 안 했어요</p>
              <p className="text-sm text-gray-500 mt-0.5">내 현재 수준을 확인해보세요</p>
            </div>
            <Link href="/assessment" className="shrink-0 bg-sand text-white text-sm px-4 py-2 rounded-lg hover:bg-sand-700 transition-colors">
              시작하기
            </Link>
          </div>
        )}

        {/* AI 인사이트 */}
        {!isDemo && user && <LearningInsight />}

        {/* 최근 대화 */}
        <div className="bg-white border border-sand-100 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">최근 대화</h3>
          {(recentConvs ?? []).length > 0 ? (
            <div className="space-y-1">
              {(recentConvs ?? []).map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-sand-50 transition-colors group"
                >
                  <span className="text-sm text-gray-800 truncate group-hover:text-sand">
                    {conv.title || '새 대화'}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {new Date(conv.updated_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">아직 대화 내역이 없습니다.</p>
          )}
        </div>

        {/* 탐구 주제 */}
        {(topics ?? []).length > 0 && (
          <div className="bg-white border border-sand-100 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">자주 탐구한 주제</h3>
            <div className="space-y-3">
              {(topics ?? []).map((topic: { id: string; tag: string; count: number }) => (
                <div key={topic.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800 w-24 shrink-0">{topic.tag}</span>
                  <div className="flex-1 bg-sand-100 rounded-full h-2">
                    <div
                      className="bg-sand h-2 rounded-full"
                      style={{ width: `${Math.min((topic.count / ((topics ?? [])[0]?.count || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right shrink-0">{topic.count}회</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/chat"
          className="block text-center bg-sand text-white rounded-xl py-3 text-sm font-medium hover:bg-sand-700 transition-colors"
        >
          AI 튜터와 대화 계속하기
        </Link>
      </main>
    </div>
  )
}
