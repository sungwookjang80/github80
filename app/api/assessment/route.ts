import { createOpenAIClient } from '@/lib/openai'
import { NextResponse } from 'next/server'

const QUESTIONS = [
  '디자인씽킹의 5단계를 순서대로 말해보세요. 각 단계가 왜 중요한지도 간단히 설명해주세요.',
  '공감(Empathy) 단계에서 가장 중요하게 생각해야 할 것은 무엇인가요? 사용자 인터뷰를 할 때 어떤 점을 주의해야 한다고 생각하나요?',
  '문제 정의(Define) 단계에서 HMW(How Might We) 질문을 만들어보세요. "직장인들이 점심시간이 너무 짧다고 느낀다"는 인사이트를 바탕으로 HMW 질문을 2~3개 작성해주세요.',
  '아이디에이션(Ideation) 단계에서 아이디어를 많이 내는 것이 왜 중요한가요? 알고 있는 아이디에이션 기법을 하나 이상 설명하고, 앞서 만든 HMW 질문 중 하나를 골라 아이디어를 3가지 이상 제시해보세요.',
  '디자인씽킹 프로세스를 실제 업무나 프로젝트, 또는 일상에서 적용해본 경험이 있나요? 있다면 구체적으로 설명해주세요. 없다면 어떤 상황에 적용해보고 싶은지 말해주세요.',
  '디자인씽킹에서 반복(Iteration)과 실패는 어떤 의미인가요? 빠른 실패(Fail Fast)가 왜 중요하다고 생각하는지, 본인의 생각을 자유롭게 이야기해주세요.',
]


const LEVEL_DESCRIPTIONS: Record<number, { title: string; summary: string }> = {
  1:  { title: '입문 전',       summary: '디자인씽킹을 처음 접하는 단계예요. 지금 이 평가 자체가 훌륭한 시작입니다!' },
  2:  { title: '호기심 단계',   summary: '개념을 들어봤지만 아직 구체적인 이해가 필요한 단계예요. 관심이 생겼다는 게 중요합니다.' },
  3:  { title: '개념 인식',     summary: '디자인씽킹의 목적과 가치는 이해하고 있어요. 이제 각 단계를 더 깊이 배워볼 차례입니다.' },
  4:  { title: '기초 이해',     summary: '5단계 프로세스를 알고 설명할 수 있는 수준이에요. 실제로 해보는 경험이 쌓이면 빠르게 성장할 거예요.' },
  5:  { title: '부분 실습',     summary: '일부 단계를 직접 경험해봤어요. 전체 프로세스를 처음부터 끝까지 해보는 것을 추천합니다.' },
  6:  { title: '프로세스 실행', summary: '전체 프로세스를 경험한 실무자 수준이에요. 반복 경험이 쌓일수록 더 날카로운 인사이트를 얻게 될 거예요.' },
  7:  { title: '반복 실무자',   summary: '여러 프로젝트에 디자인씽킹을 적용한 경험이 있는 수준이에요. 팀을 이끌 준비가 되어가고 있습니다.' },
  8:  { title: '팀 퍼실리테이터', summary: '팀 전체를 디자인씽킹 프로세스로 이끌 수 있는 수준이에요. 조직 문화 변화에 기여할 수 있습니다.' },
  9:  { title: '전문 컨설턴트', summary: '디자인씽킹을 교육하고 조직에 체계적으로 적용할 수 있는 전문가 수준이에요.' },
  10: { title: '마스터',        summary: '새로운 방법론을 개발하고 혁신을 주도할 수 있는 최고 수준의 전문가입니다.' },
}

export async function POST(request: Request) {
  const { answers } = await request.json() as { answers: { question: string; answer: string }[] }

  if (!answers || answers.length < 6) {
    return NextResponse.json({ error: 'All 6 answers are required' }, { status: 400 })
  }

  const openai = createOpenAIClient()

  const answerText = answers.map((a, i) =>
    `[질문 ${i + 1}] ${a.question}\n[답변] ${a.answer}`
  ).join('\n\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `당신은 디자인씽킹 전문가입니다. 응시자의 답변을 분석해 디자인씽킹 역량 수준을 1~10단계로 평가합니다.

평가 기준:
- 1~2단계: 개념 미인지 또는 매우 기초적 이해
- 3~4단계: 개념 이해, 단계 설명 가능하나 실습 경험 없음
- 5~6단계: 일부 또는 전체 프로세스 실습 경험
- 7~8단계: 반복 실무 경험, 팀 퍼실리테이션 가능
- 9~10단계: 전문가, 교육/컨설팅/방법론 개발 수준

반드시 다음 JSON 형식으로만 응답하세요:
{
  "level": (1~10 정수),
  "strengths": ["강점1", "강점2", "강점3"],
  "growthAreas": ["성장 포인트1", "성장 포인트2"],
  "feedback": "전체적인 피드백 2~3문장"
}`,
      },
      {
        role: 'user',
        content: `다음은 응시자의 6가지 답변입니다:\n\n${answerText}\n\n위 답변을 분석해 JSON으로 평가 결과를 주세요.`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })

  const raw = JSON.parse(completion.choices[0].message.content || '{}')
  const level = Math.min(10, Math.max(1, Math.round(Number(raw.level) || 1)))
  const meta = LEVEL_DESCRIPTIONS[level]

  return NextResponse.json({
    level,
    title: meta.title,
    summary: meta.summary,
    strengths: raw.strengths || [],
    growthAreas: raw.growthAreas || [],
    feedback: raw.feedback || '',
  })
}
