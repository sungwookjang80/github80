const TOPIC_KEYWORDS: Record<string, string[]> = {
  '디자인씽킹': ['디자인씽킹', 'design thinking', '디자인 씽킹'],
  '공감': ['공감', 'empathy', '공감 단계', '공감맵'],
  '정의': ['문제 정의', 'define', 'hmw', 'how might we'],
  '아이디에이션': ['아이디에이션', 'ideation', '브레인스토밍', 'brainstorming'],
  '프로토타입': ['프로토타입', 'prototype', '목업', 'mockup'],
  '테스트': ['사용자 테스트', 'user test', '검증', 'validation'],
  'AI활용': ['chatgpt', 'gpt', 'claude', '인공지능', 'llm', '생성형 ai'],
  '프롬프팅': ['프롬프트', 'prompt', '프롬프팅', 'prompting'],
  '자동화': ['자동화', 'automation', '워크플로우', 'workflow'],
}

export function extractTopics(content: string): string[] {
  const lower = content.toLowerCase()
  const found = new Set<string>()

  for (const [tag, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        found.add(tag)
        break
      }
    }
  }

  return Array.from(found)
}
