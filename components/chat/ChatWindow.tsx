'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import type { Message } from '@/types'

const POV_TEMPLATES = [
  {
    emoji: '🎯',
    label: 'POV 작성',
    title: '관점 진술문 만들기',
    desc: '내가 발견한 사용자 문제를 "사용자는 ~가 필요합니다. 왜냐하면 ~이기 때문입니다" 형태로 정리',
    prompt: 'POV(관점 진술문) 작성을 도와주세요. 디자인씽킹에서 POV는 공감 단계에서 발견한 인사이트를 "사용자는 [니즈]가 필요합니다. 왜냐하면 [인사이트]이기 때문입니다" 형태로 정리하는 것입니다. 제가 관찰한 사용자 상황을 말씀드릴 테니, POV 작성을 단계별로 안내해주세요.',
  },
  {
    emoji: '🔍',
    label: '문제 검증',
    title: '이게 진짜 문제일까?',
    desc: '내가 정의한 문제가 표면적 문제인지, 근본 원인인지 AI와 함께 소크라테스식 질문으로 검증',
    prompt: '제가 생각하는 문제가 진짜 문제인지 함께 확인하고 싶어요. 제 문제 정의를 말씀드릴 테니, 소크라테스식 질문으로 "왜 이게 문제인가?", "이 문제의 근본 원인은 무엇인가?"를 탐구할 수 있게 도와주세요. 표면적 문제에 머무르지 않고 진짜 문제를 찾도록 이끌어주세요.',
  },
  {
    emoji: '💡',
    label: '아이디어 발산',
    title: 'HMW로 아이디어 쏟아내기',
    desc: '정의된 문제를 HMW(How Might We) 질문으로 바꾸고, 자유롭게 아이디어를 발산',
    prompt: '아이디어 발산(아이디에이션)을 도와주세요. 해결하고 싶은 문제나 POV를 말씀드릴 테니, "How Might We(어떻게 하면 ~할 수 있을까?)" 형태의 질문으로 바꿔주세요. 그리고 양적으로 다양한 아이디어를 함께 브레인스토밍해봐요. 판단 없이 자유롭게 발산하는 것이 목표입니다.',
  },
]

export default function ChatWindow({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const autoSent = useRef(false)

  useEffect(() => {
    fetch(`/api/messages?conversationId=${conversationId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setMessages(data) })
      .catch(() => {})
  }, [conversationId])

  // 예시 질문 자동 전송 (?q= 파라미터)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !autoSent.current && messages.length === 0) {
      autoSent.current = true
      handleSend(q)
    }
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  async function handleSend(content: string) {
    const userMsg: Message = { id: crypto.randomUUID(), conversation_id: conversationId, role: 'user', content, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setStreaming(true)
    setStreamingText('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, content, messages }),
    })

    if (!res.ok || !res.body) {
      setStreaming(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') {
          setMessages(prev => [...prev, { id: crypto.randomUUID(), conversation_id: conversationId, role: 'assistant', content: full, created_at: new Date().toISOString() }])
          setStreamingText('')
          setStreaming(false)
        } else {
          try { const { text } = JSON.parse(data); full += text; setStreamingText(full) } catch {}
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 bg-nomad-bg">
        {messages.length === 0 && (
          <div className="max-w-lg mx-auto mt-10 space-y-4 animate-fade-up">
            <div className="text-center mb-6">
              <p className="text-2xl mb-2">🧠</p>
              <p className="text-base font-bold text-gray-800">AI 튜터와 대화를 시작하세요</p>
              <p className="text-sm text-gray-400 mt-1">아래 템플릿으로 바로 시작하거나, 자유롭게 질문해보세요</p>
            </div>
            <div className="space-y-2">
              {POV_TEMPLATES.map(t => (
                <button
                  key={t.label}
                  onClick={() => handleSend(t.prompt)}
                  className="w-full text-left bg-white border border-sand-100 rounded-2xl p-4 hover:border-sand-300 hover:bg-sand-50 transition-all card-hover group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-sand-50 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                      {t.emoji}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-sand mb-0.5">{t.label}</p>
                      <p className="text-sm font-semibold text-gray-800 mb-0.5">{t.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(m => <MessageBubble key={m.id} message={m} />)}
        {streaming && streamingText && (
          <MessageBubble
            message={{ id: 'streaming', conversation_id: conversationId, role: 'assistant', content: streamingText, created_at: '' }}
            streaming
          />
        )}
        {streaming && !streamingText && (
          <div className="flex justify-start mb-4 bubble-in-left">
            <div className="w-8 h-8 bg-sand rounded-full flex items-center justify-center text-white text-sm shrink-0 mr-2 mt-1 shadow-sm">
              🧠
            </div>
            <div className="bg-white border border-sand-100 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-sand-400 rounded-full typing-dot" />
              <span className="w-2 h-2 bg-sand-400 rounded-full typing-dot" />
              <span className="w-2 h-2 bg-sand-400 rounded-full typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  )
}
