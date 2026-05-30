import type { Message } from '@/types'

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${isUser ? 'bubble-in-right' : 'bubble-in-left'}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-sand rounded-full flex items-center justify-center text-white text-sm shrink-0 mr-2 mt-1 shadow-sm">
          🧠
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
        isUser
          ? 'bg-sand text-white rounded-br-sm'
          : 'bg-white border border-sand-100 text-gray-800 rounded-bl-sm'
      }`}>
        {message.content}
      </div>
    </div>
  )
}
