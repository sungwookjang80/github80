# AI 학습 플랫폼 설계 문서

**날짜:** 2026-05-28
**주제:** 개인적 구성주의 기반 디자인씽킹 & AI 활용 교육 플랫폼
**접근 방식:** A안 — AI 튜터 우선 (대화형 학습 허브)

---

## 1. 개요

기업 직원을 대상으로, 개인적 구성주의(Personal Constructivism)에 입각하여 학습자가 스스로 개념을 발견하고 구성하는 자기주도형 교육 플랫폼. 디자인씽킹과 AI 활용 방법론을 Claude 기반 AI 튜터와의 대화를 통해 탐구한다.

**핵심 가치:**
- 학습자가 원하는 주제를 자유롭게 탐구 (자기주도형)
- AI 튜터가 답을 주는 것이 아닌, 학습자 스스로 발견하도록 유도
- 대화 이력 분석을 통한 자동 개인화

---

## 2. 대상 사용자

- **주요:** 기업 직원 / 조직 내 학습자
- **학습 목표:** 디자인씽킹 방법론 이해 + AI 도구 활용 역량 강화
- **학습 방식:** 자기주도형 자유 탐구

---

## 3. 아키텍처

```
[사용자 브라우저]
     │
     ▼
[Next.js 14 프론트엔드 (App Router)]
  - 대화 UI (AI 튜터 채팅)
  - 학습 대시보드
  - 콘텐츠 카드 뷰
     │
     ▼
[Next.js API Routes / 백엔드]
  - 대화 처리 (Claude API 호출)
  - 학습 이력 저장/조회
  - 개인화 추천 로직
     │
     ├──▶ [Claude API (claude-sonnet-4-6)] — AI 튜터 응답 생성
     │
     └──▶ [PostgreSQL (Supabase)]
            - 사용자 정보
            - 대화 이력
            - 학습 활동 로그
```

---

## 4. 핵심 화면 (3개)

### ① 홈 대시보드
- AI가 추천한 오늘의 학습 주제
- 최근 대화 이어하기
- 학습 활동 현황 요약

### ② AI 튜터 채팅 (MVP 핵심)
- Claude 기반 자유 대화
- 대화 맥락 유지 (최근 N개 메시지 전송)
- 응답 스트리밍
- 대화 중 관련 콘텐츠 카드 인라인 추천

### ③ 내 학습 현황
- 대화 이력 기반 자동 분석
- 관심 주제 태그 자동 생성
- 탐구 주제 수, 대화 횟수 통계
- AI가 분석한 강점/관심 영역

---

## 5. 데이터 모델

```sql
users
  id, email, name, created_at

conversations
  id, user_id, title, created_at, updated_at

messages
  id, conversation_id, role (user/assistant), content, created_at

topics  -- 대화 이력 분석 결과
  id, user_id, tag, count, last_seen_at

content_cards  -- 학습 콘텐츠
  id, title, description, category (design_thinking/ai_usage), tags[], url
```

---

## 6. AI 튜터 동작 방식

```
1. 학습자 메시지 입력
2. 최근 N개 메시지 + 시스템 프롬프트 → Claude API 전송
   시스템 프롬프트:
   "당신은 디자인씽킹과 AI 활용을 가르치는 교육 튜터입니다.
    개인 구성주의 방식으로 학습자가 스스로 개념을 발견하도록
    질문과 탐구를 유도하세요. 답을 바로 주기보다 학습자가
    생각하고 발견하는 과정을 지원하세요."
3. Claude 응답 스트리밍으로 실시간 표시
4. 대화 저장 → 주제 태그 추출 → topics 업데이트
5. topics 기반 관련 content_cards 추천
```

---

## 7. 기술 스택

| 영역 | 선택 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| DB | PostgreSQL (Supabase) |
| 인증 | Supabase Auth |
| AI | Claude API (claude-sonnet-4-6) |
| 배포 | Vercel (github80 레포 연동) |

---

## 8. MVP 범위

**포함:**
- 사용자 인증 (이메일 로그인)
- AI 튜터 채팅 (대화 생성, 이력 저장, 스트리밍)
- 홈 대시보드 (기본)
- 내 학습 현황 (주제 태그, 기본 통계)

**포함하지 않음 (v2 이후):**
- 콘텐츠 카드 상세 관리 CMS
- 팀/조직 단위 학습 관리
- 심화 개인화 추천 알고리즘
- 모바일 앱

---

## 9. 배포

- GitHub 레포: `sungwookjang80/github80` (public)
- Vercel에 github80 레포 연동 → push 시 자동 배포
- 배포 URL: Vercel 도메인 (추후 커스텀 도메인 연결 가능)
