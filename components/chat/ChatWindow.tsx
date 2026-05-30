'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import type { Message } from '@/types'

const POV_TEMPLATES = [
  {
    emoji: '🎯',
    label: '1단계: POV 작성',
    title: '처음부터 시작하기',
    desc: 'POV 작성 → 문제 검증 → 아이디어 발산, 3단계를 AI와 함께 순서대로 진행',
    prompt: '[1단계: POV 작성부터 시작] 디자인씽킹 3단계 워크플로우를 함께 진행하고 싶어요. 1단계 POV 작성부터 시작해주세요. 제가 관찰한 사용자 상황을 말씀드릴게요.',
  },
  {
    emoji: '🔍',
    label: '2단계: 문제 검증',
    title: '문제가 진짜인지 확인하기',
    desc: '이미 문제를 정의했다면, 소크라테스식 질문으로 근본 원인을 함께 검증',
    prompt: '[2단계: 문제 검증부터 시작] POV나 문제 정의는 이미 있어요. 이게 진짜 문제인지 함께 검증해주세요. 제 문제 정의를 말씀드릴게요.',
  },
  {
    emoji: '💡',
    label: '3단계: 아이디어 발산',
    title: 'HMW로 아이디어 쏟아내기',
    desc: '문제가 명확하다면, HMW 질문으로 바꾸고 다양한 아이디어를 자유롭게 발산',
    prompt: '[3단계: 아이디어 발산부터 시작] 문제 검증까지 완료됐어요. 이제 아이디어 발산을 도와주세요. 제 문제(또는 POV)를 말씀드릴게요.',
  },
]

const STAGE_NEXT: Record<number, { label: string; prompt: string }> = {
  1: {
    label: '2단계: 문제 검증으로 →',
    prompt: '[2단계: 문제 검증] 방금 완성한 POV를 바탕으로 이게 진짜 문제인지 함께 검증해주세요.',
  },
  2: {
    label: '3단계: 아이디어 발산으로 →',
    prompt: '[3단계: 아이디어 발산] 검증된 문제를 바탕으로 HMW 질문과 아이디어 발산을 시작해주세요.',
  },
}

function detectCompletedStage(text: string): number | null {
  if (/POV\s*완성|1단계.*완료|2단계.*넘어|문제 검증.*시작/.test(text)) return 1
  if (/문제\s*검증\s*완료|2단계.*완료|3단계.*넘어|아이디에이션.*시작|아이디어\s*발산.*시작/.test(text)) return 2
  if (/아이디에이션\s*완료|3단계.*완료|모든\s*단계.*완료/.test(text)) return 3
  return null
}

export default function ChatWindow({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [nextStage, setNextStage] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const autoSent = useRef(false)

  useEffect(() => {
    fetch(`/api/messages?conversationId=${conversationId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setMessages(data) })
      .catch(() => {})
  }, [conversationId])

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
    setNextStage(null)
    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
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
          const aiMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId,
            role: 'assistant',
            content: full,
            created_at: new Date().toISOString(),
          }
          setMessages(prev => [...prev, aiMsg])
          setStreamingText('')
          setStreaming(false)
          // 단계 완성 감지
          const completed = detectCompletedStage(full)
          if (completed && completed < 3) setNextStage(completed)
        } else {
          try {
            const { text } = JSON.parse(data)
            full += text
            setStreamingText(full)
          } catch {}
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

        {/* 다음 단계 전환 버튼 */}
        {nextStage && STAGE_NEXT[nextStage] && (
          <div className="flex justify-center my-4 animate-fade-up">
            <button
              onClick={() => handleSend(STAGE_NEXT[nextStage!].prompt)}
              className="flex items-center gap-2 bg-sand text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md hover:bg-sand-700 transition-all hover:scale-105"
            >
              {STAGE_NEXT[nextStage].label}
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  )
}
