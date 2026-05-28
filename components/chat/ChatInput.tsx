'use client'

import { useState, useRef } from 'react'

export default function ChatInput({ onSend, disabled }: { onSend: (content: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end p-4 border-t border-gray-200 bg-white">
      <textarea ref={ref} value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKeyDown}
        onInput={() => { if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px' } }}
        disabled={disabled} rows={1}
        placeholder="무엇이든 질문해보세요... (Enter 전송, Shift+Enter 줄바꿈)"
        className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 max-h-32" />
      <button type="submit" disabled={!value.trim() || disabled}
        className="bg-indigo-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 shrink-0">
        전송
      </button>
    </form>
  )
}
