'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import type { Message } from '@/types'

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
          <div className="text-center text-gray-400 mt-16">
            <p className="text-2xl mb-3">🧠</p>
            <p className="text-lg font-medium text-gray-700">AI 튜터와 대화를 시작하세요</p>
            <p className="text-sm mt-2 text-gray-400">디자인씽킹, AI 활용에 대해 무엇이든 물어보세요</p>
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
