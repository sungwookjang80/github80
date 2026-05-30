'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const EXAMPLES = [
  { emoji: '🧭', label: '디자인씽킹 입문', prompt: '디자인씽킹이 뭔가요? 처음 배우는 사람에게 쉽게 설명해주세요.', color: 'hover:border-sand-400 hover:bg-sand-50' },
  { emoji: '🤝', label: '공감 단계 실습', prompt: '디자인씽킹의 공감 단계에서 사용자 인터뷰를 잘 하는 방법을 알려주세요.', color: 'hover:border-ocean-400 hover:bg-ocean-50' },
  { emoji: '💡', label: '아이디어 발산', prompt: '브레인스토밍 기법 중 가장 효과적인 방법은 무엇인가요? 예시를 들어 설명해주세요.', color: 'hover:border-amber-400 hover:bg-amber-50' },
  { emoji: '🤖', label: 'AI 프롬프팅', prompt: 'ChatGPT를 업무에 활용할 때 좋은 프롬프트 쓰는 법을 알려주세요.', color: 'hover:border-forest-400 hover:bg-forest-50' },
  { emoji: '🔁', label: 'AI + 디자인씽킹', prompt: '디자인씽킹 각 단계에서 AI를 어떻게 활용할 수 있나요?', color: 'hover:border-sand-400 hover:bg-sand-50' },
  { emoji: '🗺️', label: '실무 적용', prompt: '우리 팀의 신규 서비스 기획에 디자인씽킹을 적용하려면 어디서부터 시작해야 하나요?', color: 'hover:border-ocean-400 hover:bg-ocean-50' },
]

export default function ExamplePrompts() {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)

  async function handleClick(prompt: string, idx: number) {
    setLoading(idx)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: prompt.slice(0, 28) + '…' }),
    })
    const conv = await res.json()
    router.push(`/chat/${conv.id}?q=${encodeURIComponent(prompt)}`)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {EXAMPLES.map((ex, idx) => (
        <button
          key={ex.label}
          onClick={() => handleClick(ex.prompt, idx)}
          disabled={loading !== null}
          className={`text-left p-4 bg-white border border-sand-100 rounded-2xl transition-all card-hover group disabled:opacity-60 ${ex.color}`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-sand-50 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
              {loading === idx ? (
                <span className="text-sm animate-spin inline-block">⏳</span>
              ) : ex.emoji}
            </div>
            <div>
              <p className="text-xs font-bold text-sand mb-1">{ex.label}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{ex.prompt}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
