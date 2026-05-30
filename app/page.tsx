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
    desc: '강의 없이, 대화로 배웁니다. 궁금한 점을 자유롭게 물어보면 AI가 당신의 수준에 맞춰 함께 탐구합니다.',
    gradient: 'from-sand-50 to-amber-50',
    border: 'border-sand-200',
    delay: 'animate-fade-up-2',
  },
  {
    emoji: '🎨',
    title: '디자인씽킹 탐구',
    desc: '공감 → 문제정의 → 아이디에이션 → 프로토타입 → 테스트. 5단계를 대화로 배우고 실무에 바로 적용해보세요.',
    gradient: 'from-ocean-50 to-cyan-50',
    border: 'border-ocean-100',
    delay: 'animate-fade-up-3',
  },
  {
    emoji: '⚡',
    title: 'AI 활용법 실습',
    desc: 'ChatGPT·Claude를 업무에 제대로 쓰는 프롬프팅 기술과 자동화 아이디어를 AI 튜터와 함께 탐구합니다.',
    gradient: 'from-forest-50 to-green-50',
    border: 'border-forest-200',
    delay: 'animate-fade-up-4',
  },
]

const STEPS = [
  { step: '01', icon: '🎯', title: '주제를 골라요', desc: '디자인씽킹, AI 프롬프팅, 실무 적용 등 궁금한 주제를 선택하거나 직접 입력하세요.' },
  { step: '02', icon: '💬', title: 'AI 튜터에게 물어봐요', desc: '정답을 바로 알려주는 대신, 함께 생각하며 스스로 발견할 수 있게 도와줍니다.' },
  { step: '03', icon: '📊', title: '대화가 쌓이면 분석돼요', desc: '탐구한 주제들이 자동으로 태그되고, 내 학습 현황 페이지에서 확인할 수 있어요.' },
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
      <header className="bg-white/80 backdrop-blur border-b border-sand-100 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="font-bold text-gray-900">AI 학습 플랫폼</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/chat" className="text-sand hover:text-sand-700 font-medium transition-colors">AI 튜터</Link>
          <Link href="/assessment" className="text-gray-600 hover:text-sand transition-colors">레벨 테스트</Link>
          <Link href="/profile" className="text-gray-600 hover:text-gray-900 transition-colors">내 학습</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-12">

        {isDemo && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 animate-fade-up">
            데모 모드입니다. 대화 이력이 저장되지 않습니다.
          </div>
        )}

        {/* Hero */}
        <section className="animate-fade-up">
          <div
            className="rounded-3xl p-8 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #D4A373 0%, #c49060 40%, #b87d50 100%)',
            }}
          >
            {/* Background pattern overlay */}
            <div className="absolute inset-0 opacity-10 rounded-3xl overflow-hidden" style={{ backgroundImage: "url('/bg-pattern.svg')", backgroundSize: '60px 60px' }} />
            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -bottom-12 -left-6 w-32 h-32 bg-white/5 rounded-full" />

            {/* Floating icons */}
            <div className="absolute top-6 right-16 text-4xl animate-float opacity-80">🧭</div>
            <div className="absolute top-16 right-6 text-2xl animate-float-delay opacity-60">💡</div>
            <div className="absolute bottom-6 right-10 text-3xl animate-float-slow opacity-70">✨</div>

            <div className="relative z-10">
              <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                자기주도 학습 플랫폼
              </span>
              <h2 className="text-3xl font-black mb-3 leading-tight">
                디자인씽킹 & AI<br />함께 탐구해요
              </h2>
              <p className="text-sand-100 text-sm leading-relaxed mb-6 max-w-xs">
                AI 튜터와 1:1 대화로 배우는 새로운 방식의 학습 경험. 질문할수록 더 깊이 이해하게 됩니다.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link href="/chat"
                  className="inline-flex items-center gap-1.5 bg-white text-sand font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-sand-50 transition-all hover:scale-105 shadow-md">
                  AI 튜터 시작하기 →
                </Link>
                <Link href="/assessment"
                  className="inline-flex items-center gap-1.5 bg-white/20 text-white font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-white/30 transition-all border border-white/30">
                  내 레벨 확인하기
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 플랫폼 소개 */}
        <section>
          <div className="animate-fade-up-2">
            <h3 className="text-xl font-black text-gray-900 mb-1">이 플랫폼이 무엇인가요?</h3>
            <p className="text-sm text-gray-500 mb-5">강의를 듣는 대신, AI와 대화하며 스스로 깨닫는 방식입니다.</p>
          </div>
          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f.title}
                className={`${f.delay} bg-gradient-to-r ${f.gradient} border ${f.border} rounded-2xl p-5 flex gap-4 items-start card-hover cursor-default`}>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm shrink-0">
                  {f.emoji}
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">{f.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 사용 방법 */}
        <section className="animate-fade-up-3">
          <h3 className="text-xl font-black text-gray-900 mb-5">어떻게 사용하나요?</h3>
          <div className="relative">
            {/* connector line */}
            <div className="absolute left-[27px] top-10 bottom-10 w-0.5 bg-sand-200 hidden sm:block" />
            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <div key={s.step}
                  className="flex gap-4 bg-white border border-sand-100 rounded-2xl p-5 card-hover relative"
                  style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="w-14 h-14 bg-sand rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-white text-[10px] font-black">{s.step}</span>
                  </div>
                  <div className="pt-1">
                    <p className="font-bold text-gray-900 mb-1">{s.title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 예시 질문 */}
        <section className="animate-fade-up-4">
          <h3 className="text-xl font-black text-gray-900 mb-1">이런 질문을 해보세요</h3>
          <p className="text-sm text-gray-500 mb-5">클릭하면 바로 AI 튜터와 해당 주제로 대화를 시작합니다.</p>
          <ExamplePrompts />
        </section>

        {/* 레벨 테스트 배너 */}
        <section className="animate-fade-up-4">
          <div className="bg-white border border-sand-100 rounded-2xl p-6 flex gap-4 items-center card-hover">
            <div className="text-5xl animate-float-slow shrink-0">🎯</div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 mb-1">내 디자인씽킹 레벨은 몇 단계일까요?</p>
              <p className="text-sm text-gray-500">6가지 질문에 답하면 AI가 10단계로 분석해드립니다.</p>
            </div>
            <Link href="/assessment"
              className="shrink-0 bg-sand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sand-700 transition-all hover:scale-105">
              테스트하기
            </Link>
          </div>
        </section>

        {/* 최근 대화 */}
        {conversations.length > 0 && (
          <section className="animate-fade-up">
            <h3 className="text-xl font-black text-gray-900 mb-3">최근 대화</h3>
            <div className="space-y-2">
              {conversations.map((conv: { id: string; title: string; updated_at: string }) => (
                <Link key={conv.id} href={`/chat/${conv.id}`}
                  className="flex items-center gap-3 p-4 bg-white border border-sand-100 rounded-xl hover:border-sand-300 hover:bg-sand-50 transition-all card-hover text-sm">
                  <span className="text-lg">💬</span>
                  <span className="font-medium text-gray-900 flex-1">{conv.title}</span>
                  <span className="text-gray-400 text-xs shrink-0">{new Date(conv.updated_at).toLocaleDateString('ko-KR')}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 탐구 주제 */}
        {topics.length > 0 && (
          <section className="animate-fade-up">
            <h3 className="text-xl font-black text-gray-900 mb-3">내가 탐구 중인 주제</h3>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic: { id: string; tag: string; count: number }) => (
                <span key={topic.id}
                  className="bg-sand-50 text-sand-800 border border-sand-200 rounded-full px-4 py-1.5 text-xs font-semibold hover:bg-sand hover:text-white hover:border-sand transition-all cursor-default">
                  {topic.tag} <span className="opacity-60">({topic.count})</span>
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="h-8" />
      </main>
    </div>
  )
}
