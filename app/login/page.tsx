'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDemoStart() {
    setLoading(true)
    await fetch('/api/demo-login', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/')
    router.refresh()
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    setError('확인 이메일을 보냈습니다. 이메일을 확인해주세요.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #D4A373 0%, #c49060 40%, #b87d50 100%)' }}
      >
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('/bg-pattern.svg')", backgroundSize: '60px 60px' }} />

        {/* Hero illustration */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illust-hero.svg" alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none select-none" />

        {/* Floating decorative emojis */}
        <div className="absolute top-16 right-20 text-5xl animate-float opacity-60">🧭</div>
        <div className="absolute top-36 right-8 text-3xl animate-float-delay opacity-45">💡</div>
        <div className="absolute bottom-32 right-16 text-4xl animate-float-slow opacity-50">✨</div>

        <div className="relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-6">🧠</div>
          <h1 className="text-3xl font-black mb-2">AI 학습 플랫폼</h1>
          <p className="text-sand-100 text-sm">디자인씽킹과 AI 활용을<br />함께 탐구합니다</p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { emoji: '🧠', text: 'AI 튜터와 1:1 대화 학습' },
            { emoji: '🎯', text: '디자인씽킹 10단계 레벨 테스트' },
            { emoji: '⚡', text: 'ChatGPT·Claude 프롬프팅 실습' },
          ].map(item => (
            <div key={item.emoji} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <span className="text-xl">{item.emoji}</span>
              <span className="text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-xs text-sand-100 opacity-60">
          © 2025 AI 학습 플랫폼
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-nomad-bg">
        <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm border border-sand-100">
          <div className="mb-6">
            <div className="w-10 h-10 bg-sand rounded-xl flex items-center justify-center text-xl mb-4 lg:hidden">🧠</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">시작하기</h2>
            <p className="text-gray-500 text-sm">계정으로 로그인하거나 데모로 체험하세요</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand"
                placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-sand text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-sand-700 disabled:opacity-50 transition-colors">
              {loading ? '처리 중...' : '로그인'}
            </button>
            <button onClick={handleSignUp} disabled={loading}
              className="w-full border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-sand-50 disabled:opacity-50 transition-colors">
              회원가입
            </button>
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">또는</span></div>
            </div>
            <button onClick={handleDemoStart} disabled={loading}
              className="w-full bg-forest text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-forest-700 disabled:opacity-50 transition-colors">
              🚀 데모로 시작하기
            </button>
            <p className="text-center text-xs text-gray-400">회원가입 없이 모든 기능을 체험할 수 있어요</p>
          </div>
        </div>
      </div>
    </div>
  )
}
