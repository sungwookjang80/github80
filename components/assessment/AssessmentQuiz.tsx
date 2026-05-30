'use client'

import { useState } from 'react'
import Link from 'next/link'

const QUESTIONS = [
  '디자인씽킹의 5단계를 순서대로 말해보세요. 각 단계가 왜 중요한지도 간단히 설명해주세요.',
  '공감(Empathy) 단계에서 가장 중요하게 생각해야 할 것은 무엇인가요? 사용자 인터뷰를 할 때 어떤 점을 주의해야 한다고 생각하나요?',
  '문제 정의(Define) 단계에서 HMW(How Might We) 질문을 만들어보세요.\n\n"직장인들이 점심시간이 너무 짧다고 느낀다"는 인사이트를 바탕으로 HMW 질문을 2~3개 작성해주세요.',
  '아이디에이션(Ideation) 단계에서 아이디어를 많이 내는 것이 왜 중요한가요?\n\n알고 있는 아이디에이션 기법을 하나 이상 설명하고, 앞서 만든 HMW 질문 중 하나를 골라 아이디어를 3가지 이상 제시해보세요.',
  '디자인씽킹 프로세스를 실제 업무나 프로젝트, 또는 일상에서 적용해본 경험이 있나요?\n\n있다면 구체적으로 설명해주세요. 없다면 어떤 상황에 적용해보고 싶은지 말해주세요.',
  '디자인씽킹에서 반복(Iteration)과 실패는 어떤 의미인가요?\n\n빠른 실패(Fail Fast)가 왜 중요하다고 생각하는지, 본인의 생각을 자유롭게 이야기해주세요.',
]

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-gray-100 text-gray-700',
  3: 'bg-blue-50 text-blue-700',
  4: 'bg-blue-100 text-blue-800',
  5: 'bg-cyan-100 text-cyan-800',
  6: 'bg-teal-100 text-teal-800',
  7: 'bg-sand-100 text-sand-800',
  8: 'bg-sand-200 text-sand-900',
  9: 'bg-amber-100 text-amber-800',
  10: 'bg-amber-200 text-amber-900',
}

const LEVEL_EMOJIS: Record<number, string> = {
  1: '🌱', 2: '🌿', 3: '📖', 4: '🔍', 5: '🛠️',
  6: '⚙️', 7: '🚀', 8: '🎯', 9: '🏆', 10: '👑',
}

type Result = {
  level: number
  title: string
  summary: string
  strengths: string[]
  growthAreas: string[]
  feedback: string
}

export default function AssessmentQuiz() {
  const [step, setStep] = useState<'intro' | 'quiz' | 'loading' | 'result'>('intro')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(''))
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  function handleAnswer(val: string) {
    const next = [...answers]
    next[current] = val
    setAnswers(next)
  }

  function handleNext() {
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1)
    } else {
      submitAssessment()
    }
  }

  function handlePrev() {
    if (current > 0) setCurrent(c => c - 1)
  }

  async function submitAssessment() {
    setStep('loading')
    try {
      const payload = QUESTIONS.map((q, i) => ({ question: q.split('\n')[0], answer: answers[i] }))
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      })
      const data = await res.json()
      setResult(data)
      setStep('result')
    } catch {
      setError('평가 중 오류가 발생했습니다. 다시 시도해주세요.')
      setStep('quiz')
    }
  }

  // ── Intro ──
  if (step === 'intro') return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-sand rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-2 top-2 opacity-10 text-[80px] leading-none select-none">🎯</div>
        <p className="text-sand-100 text-sm mb-1">나의 역량 파악</p>
        <h2 className="text-2xl font-bold mb-2">디자인씽킹 레벨 테스트</h2>
        <p className="text-sand-100 text-sm leading-relaxed">
          6가지 질문에 자유롭게 답하면, AI가 당신의 디자인씽킹 수준을 10단계로 분석해드립니다.
          정답이 없어요. 솔직하게 답할수록 정확한 결과가 나옵니다.
        </p>
      </div>

      <div className="bg-white border border-sand-100 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">테스트 안내</h3>
        {[
          { icon: '📝', text: '총 6개 질문 — 각 질문에 자유롭게 서술형으로 답해주세요.' },
          { icon: '⏱️', text: '소요 시간 약 10~15분 — 충분히 생각하고 답해도 됩니다.' },
          { icon: '🤖', text: 'AI가 분석 — 답변 완료 후 GPT-4o가 10단계로 수준을 평가합니다.' },
          { icon: '🎁', text: '강점과 성장 포인트 — 내가 잘하는 것과 더 배울 것을 알 수 있어요.' },
        ].map(item => (
          <div key={item.icon} className="flex gap-3 text-sm text-gray-600">
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-sand-100 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-3">10단계 레벨 미리보기</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(LEVEL_EMOJIS).map(([lv, emoji]) => (
            <div key={lv} className={`${LEVEL_COLORS[Number(lv)]} rounded-lg p-2 text-center`}>
              <div className="text-lg">{emoji}</div>
              <div className="text-xs font-bold">Lv.{lv}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setStep('quiz')}
        className="w-full bg-sand text-white py-3 rounded-xl font-semibold hover:bg-sand-700 transition-colors"
      >
        테스트 시작하기 →
      </button>
    </div>
  )

  // ── Quiz ──
  if (step === 'quiz') {
    const progress = ((current + 1) / QUESTIONS.length) * 100
    const canProceed = answers[current].trim().length > 5

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>질문 {current + 1} / {QUESTIONS.length}</span>
            <span>{Math.round(progress)}% 완료</span>
          </div>
          <div className="w-full bg-sand-100 rounded-full h-2">
            <div className="bg-sand h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white border border-sand-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-sand text-white text-xs font-bold px-2.5 py-1 rounded-full">Q{current + 1}</span>
            <span className="text-xs text-gray-400">디자인씽킹 레벨 테스트</span>
          </div>
          <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-line mb-5">
            {QUESTIONS[current]}
          </p>
          <textarea
            value={answers[current]}
            onChange={e => handleAnswer(e.target.value)}
            rows={6}
            placeholder="자유롭게 답변을 작성해주세요. 모르면 '모른다'고 솔직하게 적어도 됩니다."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sand resize-none leading-relaxed"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {current > 0 && (
            <button onClick={handlePrev}
              className="flex-1 border border-sand-200 text-sand-700 py-3 rounded-xl font-medium hover:bg-sand-50 transition-colors">
              ← 이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex-1 bg-sand text-white py-3 rounded-xl font-semibold hover:bg-sand-700 disabled:opacity-40 transition-colors"
          >
            {current < QUESTIONS.length - 1 ? '다음 질문 →' : '결과 보기 →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Loading ──
  if (step === 'loading') return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="text-5xl animate-bounce">🧠</div>
      <p className="text-lg font-semibold text-gray-800">AI가 답변을 분석 중입니다…</p>
      <p className="text-sm text-gray-500">GPT-4o가 6개의 답변을 종합해 레벨을 측정하고 있어요.</p>
      <div className="w-48 bg-sand-100 rounded-full h-1.5 mt-4">
        <div className="bg-sand h-1.5 rounded-full animate-pulse w-full" />
      </div>
    </div>
  )

  // ── Result ──
  if (step === 'result' && result) {
    const lv = result.level
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-5">

        {/* Level badge */}
        <div className="bg-white border border-sand-100 rounded-3xl p-8 text-center animate-scale-in shadow-lg">
          <div className="text-7xl mb-4 animate-float">{LEVEL_EMOJIS[lv]}</div>
          <div className={`inline-block ${LEVEL_COLORS[lv]} px-5 py-1.5 rounded-full text-sm font-black mb-4 shadow-sm`}>
            Level {lv} / 10
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">{result.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">{result.summary}</p>
        </div>

        {/* Level bar */}
        <div className="bg-white border border-sand-100 rounded-2xl p-5 animate-fade-up-2">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>🌱 입문 전</span>
            <span>👑 마스터</span>
          </div>
          <div className="w-full bg-sand-100 rounded-full h-4 mb-4 overflow-hidden">
            <div
              className="animate-shimmer h-4 rounded-full transition-all duration-1000"
              style={{ width: `${lv * 10}%` }}
            />
          </div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <div key={n}
                className={`h-8 rounded-lg text-xs font-black flex items-center justify-center transition-all ${
                  n <= lv ? 'bg-sand text-white shadow-sm' : 'bg-sand-50 text-sand-200'
                } ${n === lv ? 'ring-2 ring-sand-400 scale-110' : ''}`}>
                {n}
              </div>
            ))}
          </div>
        </div>

        {/* AI Feedback */}
        <div className="bg-gradient-to-r from-sand-50 to-amber-50 border border-sand-200 rounded-2xl p-5 animate-fade-up-3">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-lg">💬</span> AI 피드백
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">{result.feedback}</p>
        </div>

        {/* Strengths & Growth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up-4">
          <div className="bg-forest-50 border border-forest-200 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>✅</span> 나의 강점
            </h3>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-forest-600 shrink-0 font-bold">›</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-ocean-50 border border-ocean-100 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>🌱</span> 성장 포인트
            </h3>
            <ul className="space-y-2">
              {result.growthAreas.map((g, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-ocean shrink-0 font-bold">›</span>{g}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 animate-fade-up-4">
          <button
            onClick={() => { setStep('intro'); setCurrent(0); setAnswers(Array(QUESTIONS.length).fill('')); setResult(null) }}
            className="border border-sand-200 text-sand-700 py-3 rounded-xl text-sm font-semibold hover:bg-sand-50 transition-all"
          >
            🔄 다시 테스트하기
          </button>
          <Link href="/chat" className="bg-sand text-white py-3 rounded-xl text-sm font-semibold text-center hover:bg-sand-700 transition-all hover:scale-105 shadow-sm">
            AI 튜터와 학습하기 →
          </Link>
        </div>
      </div>
    )
  }

  return null
}
