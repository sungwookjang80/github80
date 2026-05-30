import { describe, it, expect } from 'vitest'
import { extractTopics } from '@/lib/topics'

describe('extractTopics', () => {
  it('디자인씽킹 관련 키워드를 추출한다', () => {
    const content = '디자인씽킹의 공감 단계에서 사용자 인터뷰를 어떻게 하나요?'
    const topics = extractTopics(content)
    expect(topics).toContain('디자인씽킹')
    expect(topics).toContain('공감')
  })

  it('AI 활용 관련 키워드를 추출한다', () => {
    const content = 'ChatGPT 프롬프트를 잘 쓰는 방법이 궁금해요'
    const topics = extractTopics(content)
    expect(topics).toContain('AI활용')
    expect(topics).toContain('프롬프팅')
  })

  it('관련 키워드가 없으면 빈 배열을 반환한다', () => {
    const content = '오늘 날씨가 좋네요'
    const topics = extractTopics(content)
    expect(topics).toHaveLength(0)
  })

  it('중복 태그를 반환하지 않는다', () => {
    const content = '공감 단계와 공감 맵 작성 방법'
    const topics = extractTopics(content)
    const unique = new Set(topics)
    expect(unique.size).toBe(topics.length)
  })

  it('대소문자를 구분하지 않는다', () => {
    const content = 'Design Thinking을 배우고 싶어요'
    const topics = extractTopics(content)
    expect(topics).toContain('디자인씽킹')
  })

  it('아이디에이션 키워드를 추출한다', () => {
    const content = '브레인스토밍으로 아이디어를 발산해봐요'
    const topics = extractTopics(content)
    expect(topics).toContain('아이디에이션')
  })
})
