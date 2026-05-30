import { describe, it, expect } from 'vitest'
import { buildMessages, TUTOR_SYSTEM_PROMPT } from '@/lib/openai'
import type { Message } from '@/types'

describe('buildMessages', () => {
  it('최근 20개 메시지만 포함한다', () => {
    const messages: Message[] = Array.from({ length: 25 }, (_, i) => ({
      id: `${i}`,
      conversation_id: 'conv-1',
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `message ${i}`,
      created_at: new Date().toISOString(),
    }))

    const result = buildMessages(messages)
    expect(result).toHaveLength(20)
  })

  it('가장 최근 메시지가 마지막에 온다', () => {
    const messages: Message[] = [
      { id: '1', conversation_id: 'c', role: 'user', content: 'first', created_at: '' },
      { id: '2', conversation_id: 'c', role: 'assistant', content: 'second', created_at: '' },
    ]

    const result = buildMessages(messages)
    expect(result[result.length - 1].content).toBe('second')
  })

  it('role을 올바르게 매핑한다', () => {
    const messages: Message[] = [
      { id: '1', conversation_id: 'c', role: 'user', content: 'hello', created_at: '' },
    ]

    const result = buildMessages(messages)
    expect(result[0].role).toBe('user')
    expect(result[0].content).toBe('hello')
  })

  it('빈 배열을 처리한다', () => {
    expect(buildMessages([])).toHaveLength(0)
  })
})

describe('TUTOR_SYSTEM_PROMPT', () => {
  it('디자인씽킹 튜터 역할을 포함한다', () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain('디자인씽킹')
    expect(TUTOR_SYSTEM_PROMPT).toContain('AI')
  })

  it('한국어 응답을 명시한다', () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain('한국어')
  })
})
