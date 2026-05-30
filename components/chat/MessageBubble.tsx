import type { Message } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MessageBubble({ message, streaming }: { message: Message; streaming?: boolean }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${isUser ? 'bubble-in-right' : 'bubble-in-left'}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-sand rounded-full flex items-center justify-center text-white text-sm shrink-0 mr-2 mt-1 shadow-sm">
          🧠
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
        isUser
          ? 'bg-sand text-white rounded-br-sm whitespace-pre-wrap'
          : 'bg-white border border-sand-100 text-gray-800 rounded-bl-sm'
      }`}>
        {isUser ? (
          message.content
        ) : (
          <div>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 pl-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5 pl-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                pre: ({ children }) => (
                  <pre className="bg-gray-100 text-gray-800 rounded-xl px-3 py-2 text-xs font-mono overflow-x-auto mb-2 whitespace-pre-wrap">
                    {children}
                  </pre>
                ),
                code: ({ className, children }) => {
                  if (className?.startsWith('language-')) {
                    return <code className={className}>{children}</code>
                  }
                  return (
                    <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  )
                },
                h1: ({ children }) => <h1 className="font-bold text-base mb-2 mt-1">{children}</h1>,
                h2: ({ children }) => <h2 className="font-bold text-sm mb-1.5 mt-1">{children}</h2>,
                h3: ({ children }) => <h3 className="font-semibold text-sm mb-1 mt-1">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-sand-300 pl-3 text-gray-500 italic mb-2">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="border-gray-200 my-2" />,
                a: ({ href, children }) => (
                  <a href={href} className="text-sand-700 underline hover:text-sand" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {streaming && (
              <span className="cursor-blink inline-block w-0.5 h-3.5 bg-gray-400 ml-0.5 align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
