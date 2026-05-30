export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ExamplePrompts from '@/components/home/ExamplePrompts'

const FEATURES = [
  {
    emoji: '🧠',
    title: 'AI 튜터와 1:1 대화',
    desc: '궁금한 것을 자유롭게 질문하세요. AI 튜터가 당신의 수준에 맞게 설명하고, 스스로 답을 발견할 수 있도록 안내합니다.',
    bg: 'bg-sand-50',
    border: 'border-sand-200',
  },
  {
    emoji: '🎨',
    title: '디자인씽킹 탐구',
    desc: '공감 → 문제정의 → 아이디에이션 → 프로토타입 → 테스트, 5단계를 대화로 배웁니다. 실제 업무 문제에 바로 적용해보세요.',
    bg: 'bg-ocean-50',
    border: 'border-ocean-200',
  },
  {
    emoji: '⚡',
    title: 'AI 활용법 실습',
    desc: 'ChatGPT·Claude 등 AI 도구를 업무에 제대로 쓰는 프롬프팅 기술, 자동화 아이디어를 함께 탐구합니다.',
    bg: 'bg-forest-50',
    border: 'border-forest-200',
  },
]

const STEPS = [
  { step: '01', title: '주제를 골라요', desc: '디자인씽킹, AI 프롬프팅, 실무 적용 등 궁금한 주제를 선택하거나 직접 입력하세요.' },
  { step: '02', title: 'AI 튜터에게 물어봐요', desc: '정답을 바로 알려주는 대신, 함께 생각하며 스스로 발견할 수 있게 도와줍니다.' },
  { step: '03', title: '대화가 쌓이면 분석돼요', desc: '내가 탐구한 주제들이 자동으로 태그되고, 학습 현황 페이지에서 확인할 수 있어요.' },
]

export default async function HomePage() {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('demo-user')?.value === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isDemo) redirect('/login')

  const conversations = isDemo || !user ? [] : (
    await supabase.from('conversations').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(3)
  ).data ?? []

  const topics = isDemo || !user ? [] : (
    await supabase.from('topics').select('*').eq('user_id', user.id).order('count', { ascending: false }).limit(6)
  ).data ?? []

  return (
    <div className="min-h-screen bg-nomad-bg">
      {/* Header */}
      <header className="bg-white border-b border-sand-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="font-bold text-gray-900">AI 학습 플랫폼</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/chat" className="text-sand hover:text-sand-700 font-medium">AI 튜터</Link>
          <Link href="/profile" className="text-gray-600 hover:text-gray-900">내 학습</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-10">

        {/* Demo 배너 */}
        {isDemo && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            데모 모드입니다. 대화 이력이 저장되지 않습니다.
          </div>
        )}

        {/* Hero */}
        <div className="bg-sand rounded-2xl p-6 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 text-[120px] leading-none select-none">🧭</div>
          <p className="text-sand-100 text-sm mb-1">어서오세요!</p>
          <h2 className="text-2xl font-bold mb-2">디자인씽킹 & AI 활용<br />학습 플랫폼</h2>
          <p className="text-sand-100 text-sm mb-5 leading-relaxed">
            AI 튜터와 1:1 대화로 디자인씽킹과 AI 도구 활용법을<br className="hidden sm:block" />
            스스로 발견하며 배우는 자기주도 학습 공간입니다.
          </p>
          <Link href="/chat"
            className="inline-block bg-white text-sand rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-sand-50">
            지금 AI 튜터와 대화하기 →
          </Link>
        </div>

        {/* 플랫폼 소개 */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-1">이 플랫폼이 무엇인가요?</h3>
          <p className="text-sm text-gray-500 mb-4">강의를 듣는 대신, AI와 대화하며 스스로 깨닫는 방식입니다.</p>
          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f.title} className={`${f.bg} border ${f.border} rounded-xl p-4 flex gap-4 items-start`}>
                <span className="text-3xl shrink-0">{f.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{f.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 사용 방법 */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-4">어떻게 사용하나요?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map(s => (
              <div key={s.step} className="bg-white border border-sand-100 rounded-xl p-4">
                <p className="text-3xl font-black text-sand-200 mb-2">{s.step}</p>
                <p className="font-semibold text-gray-900 text-sm mb-1">{s.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 예시 질문 */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-1">이런 질문을 해보세요</h3>
          <p className="text-sm text-gray-500 mb-4">클릭하면 바로 AI 튜터와 해당 주제로 대화를 시작합니다.</p>
          <ExamplePrompts />
        </section>

        {/* 최근 대화 */}
        {conversations.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">최근 대화</h3>
            <div className="space-y-2">
              {conversations.map((conv: { id: string; title: string; updated_at: string }) => (
                <Link key={conv.id} href={`/chat/${conv.id}`}
                  className="block p-3 bg-white border border-sand-100 rounded-xl hover:border-sand-300 text-sm transition-colors">
                  <span className="font-medium text-gray-900">{conv.title}</span>
                  <span className="text-gray-400 text-xs ml-2">{new Date(conv.updated_at).toLocaleDateString('ko-KR')}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 탐구 주제 */}
        {topics.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">내가 탐구 중인 주제</h3>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic: { id: string; tag: string; count: number }) => (
                <span key={topic.id} className="bg-sand-50 text-sand-800 border border-sand-200 rounded-full px-3 py-1 text-xs font-medium">
                  {topic.tag} <span className="text-sand-400">({topic.count})</span>
                </span>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
