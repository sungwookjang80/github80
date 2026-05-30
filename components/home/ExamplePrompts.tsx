'use client'

import { useRouter } from 'next/navigation'

const EXAMPLES = [
  { emoji: '🧭', label: '디자인씽킹 입문', prompt: '디자인씽킹이 뭔가요? 처음 배우는 사람에게 쉽게 설명해주세요.' },
  { emoji: '🤝', label: '공감 단계 실습', prompt: '디자인씽킹의 공감 단계에서 사용자 인터뷰를 잘 하는 방법을 알려주세요.' },
  { emoji: '💡', label: '아이디어 발산', prompt: '브레인스토밍 기법 중 가장 효과적인 방법은 무엇인가요? 예시를 들어 설명해주세요.' },
  { emoji: '🤖', label: 'AI 프롬프팅', prompt: 'ChatGPT를 업무에 활용할 때 좋은 프롬프트 쓰는 법을 알려주세요.' },
  { emoji: '🔁', label: 'AI + 디자인씽킹', prompt: '디자인씽킹 각 단계에서 AI를 어떻게 활용할 수 있나요?' },
  { emoji: '🗺️', label: '실무 적용', prompt: '우리 팀의 신규 서비스 기획에 디자인씽킹을 적용하려면 어디서부터 시작해야 하나요?' },
]

export default function ExamplePrompts() {
  const router = useRouter()

  async function handleClick(prompt: string) {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: prompt.slice(0, 30) + '…' }),
    })
    const conv = await res.json()
    router.push(`/chat/${conv.id}?q=${encodeURIComponent(prompt)}`)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {EXAMPLES.map(ex => (
        <button
          key={ex.label}
          onClick={() => handleClick(ex.prompt)}
          className="text-left p-4 bg-white border border-sand-100 rounded-xl hover:border-sand-400 hover:bg-sand-50 transition-colors group"
        >
          <span className="text-2xl mb-2 block">{ex.emoji}</span>
          <p className="text-xs font-semibold text-sand mb-1">{ex.label}</p>
          <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-900">{ex.prompt}</p>
        </button>
      ))}
    </div>
  )
}
