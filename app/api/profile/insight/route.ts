import { createOpenAIClient } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conversations } = await supabase
    .from('conversations')
    .select('title, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: topics } = await supabase
    .from('topics')
    .select('tag, count')
    .eq('user_id', user.id)
    .order('count', { ascending: false })
    .limit(10)

  if (!conversations?.length && !topics?.length) {
    return NextResponse.json({ insight: null })
  }

  const topicList = (topics || []).map(t => `${t.tag}(${t.count}회)`).join(', ')
  const convTitles = (conversations || []).map(c => c.title).filter(Boolean).join(', ')

  const prompt = `다음은 사용자의 AI 튜터 학습 기록입니다.

최근 대화 주제: ${convTitles || '없음'}
자주 탐구한 키워드: ${topicList || '없음'}

이 학습 패턴을 바탕으로 3~4문장의 개인화된 학습 인사이트를 한국어로 작성해주세요.
- 어떤 영역에 관심이 많은지
- 학습 깊이나 방향성
- 다음 단계로 추천할 내용
친근하고 격려하는 톤으로 작성해주세요.`

  try {
    const openai = createOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    })
    const insight = response.choices[0]?.message?.content ?? null
    return NextResponse.json({ insight })
  } catch {
    return NextResponse.json({ insight: null })
  }
}
