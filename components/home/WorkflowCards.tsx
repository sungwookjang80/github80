'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const WORKFLOW = [
  {
    step: '01',
    emoji: '🎯',
    label: 'POV 작성',
    title: '진짜 사용자 문제 정의',
    desc: '관찰한 내용을 "사용자는 ~가 필요합니다. 왜냐하면 ~" 형태의 관점 진술문으로 정리합니다.',
    color: 'from-sand-50 to-amber-50',
    border: 'border-sand-200',
    badge: 'bg-sand text-white',
    prompt: 'POV(관점 진술문) 작성을 도와주세요. 디자인씽킹에서 POV는 공감 단계에서 발견한 인사이트를 "사용자는 [니즈]가 필요합니다. 왜냐하면 [인사이트]이기 때문입니다" 형태로 정리하는 것입니다. 제가 관찰한 사용자 상황을 말씀드릴 테니, POV 작성을 단계별로 안내해주세요.',
  },
  {
    step: '02',
    emoji: '🔍',
    label: '문제 검증',
    title: '이게 진짜 문제일까?',
    desc: '내 문제 정의가 표면적 증상인지, 진짜 근본 원인인지 AI의 소크라테스식 질문으로 검증합니다.',
    color: 'from-ocean-50 to-cyan-50',
    border: 'border-ocean-100',
    badge: 'bg-ocean text-white',
    prompt: '제가 생각하는 문제가 진짜 문제인지 함께 확인하고 싶어요. 제 문제 정의를 말씀드릴 테니, 소크라테스식 질문으로 "왜 이게 문제인가?", "이 문제의 근본 원인은 무엇인가?"를 탐구할 수 있게 도와주세요. 표면적 문제에 머무르지 않고 진짜 문제를 찾도록 이끌어주세요.',
  },
  {
    step: '03',
    emoji: '💡',
    label: '아이디어 발산',
    title: 'HMW로 아이디어 쏟아내기',
    desc: '문제를 HMW(How Might We) 질문으로 바꾸고, 판단 없이 다양한 아이디어를 자유롭게 발산합니다.',
    color: 'from-forest-50 to-green-50',
    border: 'border-forest-200',
    badge: 'bg-forest text-white',
    prompt: '아이디어 발산(아이디에이션)을 도와주세요. 해결하고 싶은 문제나 POV를 말씀드릴 테니, "How Might We(어떻게 하면 ~할 수 있을까?)" 형태의 질문으로 바꿔주세요. 그리고 양적으로 다양한 아이디어를 함께 브레인스토밍해봐요. 판단 없이 자유롭게 발산하는 것이 목표입니다.',
  },
]

export default function WorkflowCards() {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)

  async function handleClick(prompt: string, idx: number) {
    setLoading(idx)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: WORKFLOW[idx].label + ' — ' + WORKFLOW[idx].title }),
    })
    const conv = await res.json()
    router.push(`/chat/${conv.id}?q=${encodeURIComponent(prompt)}`)
  }

  return (
    <div className="space-y-3">
      {WORKFLOW.map((w, idx) => (
        <button
          key={w.step}
          onClick={() => handleClick(w.prompt, idx)}
          disabled={loading !== null}
          className={`w-full text-left bg-gradient-to-r ${w.color} border ${w.border} rounded-2xl p-5 card-hover group disabled:opacity-60 transition-all`}
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                {loading === idx ? <span className="text-sm animate-spin inline-block">⏳</span> : w.emoji}
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${w.badge}`}>
                {w.step}
              </span>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{w.label}</span>
              </div>
              <p className="font-bold text-gray-900 mb-1">{w.title}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{w.desc}</p>
            </div>
            <div className="shrink-0 text-gray-300 group-hover:text-sand group-hover:translate-x-1 transition-all text-lg mt-2">
              →
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
