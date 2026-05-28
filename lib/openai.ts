import OpenAI from 'openai'
import type { Message } from '@/types'

export const TUTOR_SYSTEM_PROMPT = `당신은 디자인씽킹과 AI 활용을 가르치는 교육 튜터입니다.
개인 구성주의 방식으로 학습자가 스스로 개념을 발견하도록 질문과 탐구를 유도하세요.
답을 바로 주기보다 학습자가 생각하고 발견하는 과정을 지원하세요.
응답은 한국어로 하되, 필요한 경우 영어 용어를 병기하세요.`

export function buildMessages(messages: Message[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.slice(-20).map(m => ({
    role: m.role,
    content: m.content,
  }))
}

export function createOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}
