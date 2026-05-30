'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import type { Message } from '@/types'

export default function ChatWindow({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('messages').select('*').eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data) })
  }, [conversationId])

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

    const reader = res.body!.getReader()
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
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-16">
            <p className="text-lg font-medium">AI 튜터와 대화를 시작하세요</p>
            <p className="text-sm mt-2">디자인씽킹, AI 활용에 대해 무엇이든 물어보세요</p>
          </div>
        )}
        {messages.map(m => <MessageBubble key={m.id} message={m} />)}
        {streaming && streamingText && (
          <MessageBubble message={{ id: 'streaming', conversation_id: conversationId, role: 'assistant', content: streamingText, created_at: '' }} />
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  )
}
