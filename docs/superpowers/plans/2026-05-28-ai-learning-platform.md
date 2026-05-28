# AI 학습 플랫폼 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude 기반 AI 튜터 채팅을 핵심으로 하는 자기주도형 교육 플랫폼 MVP 구현

**Architecture:** Next.js 14 App Router + Supabase(PostgreSQL + Auth) + Claude API. AI 튜터 채팅이 중심이며, 대화 이력을 분석해 주제 태그를 자동 추출하고 홈 대시보드에 학습 현황을 표시한다.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Claude API (claude-sonnet-4-6), Vitest

---

## Task 1: 프로젝트 초기 설정

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`
- Create: `.env.local.example`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd "C:/Users/장성욱업무지원팀52g/antigravity/github80"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected: Next.js 14 프로젝트 파일 생성됨

- [ ] **Step 2: 추가 의존성 설치**

```bash
npm install @anthropic-ai/sdk @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: vitest 설정 추가**

`vitest.config.ts` 생성:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

`vitest.setup.ts` 생성:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: package.json에 test 스크립트 추가**

`package.json`의 `scripts`에 추가:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: .env.local.example 생성**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

- [ ] **Step 6: .env.local.example을 .gitignore에 추가 확인 (이미 있음), 커밋**

```bash
git add .
git commit -m "feat: initialize Next.js 14 project with Supabase and Claude deps"
```

---

## Task 2: TypeScript 타입 정의

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: 공유 타입 정의**

`types/index.ts`:

```typescript
export type Role = 'user' | 'assistant'

export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: Role
  content: string
  created_at: string
}

export interface Topic {
  id: string
  user_id: string
  tag: string
  count: number
  last_seen_at: string
}

export interface ContentCard {
  id: string
  title: string
  description: string
  category: 'design_thinking' | 'ai_usage'
  tags: string[]
  url: string
}
```

- [ ] **Step 2: 커밋**

```bash
git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Supabase DB 스키마 및 클라이언트 설정

**Files:**
- Create: `lib/supabase/schema.sql`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: DB 스키마 작성**

`lib/supabase/schema.sql`:

```sql
-- users 테이블 (Supabase Auth users 확장)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  created_at timestamptz default now()
);

-- conversations 테이블
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default '새 대화',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- messages 테이블
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);

-- topics 테이블 (대화 이력 분석 결과)
create table if not exists public.topics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tag text not null,
  count integer default 1,
  last_seen_at timestamptz default now(),
  unique(user_id, tag)
);

-- content_cards 테이블
create table if not exists public.content_cards (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  category text check (category in ('design_thinking', 'ai_usage')) not null,
  tags text[] default '{}',
  url text not null
);

-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.topics enable row level security;

-- RLS 정책: 본인 데이터만 접근
create policy "profiles: own data" on public.profiles for all using (auth.uid() = id);
create policy "conversations: own data" on public.conversations for all using (auth.uid() = user_id);
create policy "messages: own conversations" on public.messages for all
  using (exists (select 1 from public.conversations where id = conversation_id and user_id = auth.uid()));
create policy "topics: own data" on public.topics for all using (auth.uid() = user_id);
create policy "content_cards: public read" on public.content_cards for select using (true);

-- 신규 사용자 가입 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 2: Supabase 브라우저 클라이언트**

`lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Supabase 서버 클라이언트**

`lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 4: Supabase 대시보드에서 schema.sql 실행**

Supabase 프로젝트 생성 후 SQL Editor에서 `lib/supabase/schema.sql` 내용 실행.
`.env.local` 파일에 실제 값 입력:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

- [ ] **Step 5: 커밋**

```bash
git add lib/supabase/
git commit -m "feat: add Supabase schema and client setup"
```

---

## Task 4: 인증 — 로그인 페이지 및 미들웨어

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `middleware.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: 미들웨어 작성 (인증 보호)**

`middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  if (!user && !isAuthPage && !isApiRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: 로그인 페이지 작성**

`app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setError('확인 이메일을 보냈습니다. 이메일을 확인해주세요.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI 학습 플랫폼</h1>
        <p className="text-gray-500 mb-6 text-sm">디자인씽킹과 AI 활용을 탐구하세요</p>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '처리 중...' : '로그인'}
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            회원가입
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 루트 레이아웃 업데이트**

`app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI 학습 플랫폼',
  description: '개인 구성주의 기반 디자인씽킹 & AI 활용 교육',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: 개발 서버 실행해서 로그인 화면 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` → 로그인 페이지로 리다이렉트 확인

- [ ] **Step 5: 커밋**

```bash
git add app/ middleware.ts
git commit -m "feat: add authentication with Supabase Auth"
```

---

## Task 5: Claude API 래퍼 (TDD)

**Files:**
- Create: `lib/claude.ts`
- Create: `__tests__/lib/claude.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/lib/claude.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildMessages, TUTOR_SYSTEM_PROMPT } from '@/lib/claude'
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
})

describe('TUTOR_SYSTEM_PROMPT', () => {
  it('개인 구성주의 튜터 역할을 포함한다', () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain('디자인씽킹')
    expect(TUTOR_SYSTEM_PROMPT).toContain('AI')
  })
})
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

```bash
npm run test:run -- __tests__/lib/claude.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/claude'`

- [ ] **Step 3: Claude 래퍼 구현**

`lib/claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
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

export function createAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

```bash
npm run test:run -- __tests__/lib/claude.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add lib/claude.ts __tests__/lib/claude.test.ts
git commit -m "feat: add Claude API wrapper with tests"
```

---

## Task 6: 주제 태그 추출 로직 (TDD)

**Files:**
- Create: `lib/topics.ts`
- Create: `__tests__/lib/topics.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/lib/topics.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { extractTopics } from '@/lib/topics'

describe('extractTopics', () => {
  it('디자인씽킹 관련 키워드를 추출한다', () => {
    const content = '공감 단계에서 사용자 인터뷰를 어떻게 하나요?'
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
})
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

```bash
npm run test:run -- __tests__/lib/topics.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/topics'`

- [ ] **Step 3: 주제 추출 구현**

`lib/topics.ts`:

```typescript
const TOPIC_KEYWORDS: Record<string, string[]> = {
  '디자인씽킹': ['디자인씽킹', 'design thinking', '디자인 씽킹'],
  '공감': ['공감', 'empathy', '공감 단계', '공감맵', '공감 맵'],
  '정의': ['문제 정의', 'define', '정의 단계', 'hmw', 'how might we'],
  '아이디에이션': ['아이디에이션', 'ideation', '아이디어 발산', '브레인스토밍', 'brainstorming'],
  '프로토타입': ['프로토타입', 'prototype', '시제품', '목업', 'mockup'],
  '테스트': ['사용자 테스트', 'user test', '검증', 'validation'],
  'AI활용': ['ai', 'chatgpt', 'claude', '인공지능', 'llm', 'gpt', '생성형 ai', '생성형ai'],
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
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

```bash
npm run test:run -- __tests__/lib/topics.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add lib/topics.ts __tests__/lib/topics.test.ts
git commit -m "feat: add topic extraction logic with tests"
```

---

## Task 7: Chat API Route (Claude 스트리밍)

**Files:**
- Create: `app/api/chat/route.ts`
- Create: `app/api/conversations/route.ts`

- [ ] **Step 1: 대화 목록 API 작성**

`app/api/conversations/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title } = await request.json()

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: user.id, title: title || '새 대화' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Chat 스트리밍 API 작성**

`app/api/chat/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient, buildMessages, TUTOR_SYSTEM_PROMPT } from '@/lib/claude'
import { extractTopics } from '@/lib/topics'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId, content } = await request.json()

  if (!conversationId || !content?.trim()) {
    return NextResponse.json({ error: 'conversationId and content are required' }, { status: 400 })
  }

  // 사용자 메시지 저장
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: content.trim(),
  })

  // 기존 메시지 이력 조회
  const { data: history } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const anthropic = createAnthropicClient()
  const messages = buildMessages(history || [])

  // Claude 스트리밍 응답
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: TUTOR_SYSTEM_PROMPT,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      let fullText = ''

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text
          fullText += text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
      }

      // AI 응답 저장
      const { data: savedMessage } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, role: 'assistant', content: fullText })
        .select()
        .single()

      // 주제 태그 추출 및 업데이트
      const topics = extractTopics(content + ' ' + fullText)
      for (const tag of topics) {
        await supabase.from('topics').upsert(
          { user_id: user.id, tag, count: 1, last_seen_at: new Date().toISOString() },
          { onConflict: 'user_id,tag', ignoreDuplicates: false }
        )
      }

      // 대화 updated_at 갱신
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/api/
git commit -m "feat: add chat streaming API and conversations API"
```

---

## Task 8: AI 튜터 채팅 UI 컴포넌트

**Files:**
- Create: `components/chat/MessageBubble.tsx`
- Create: `components/chat/ChatInput.tsx`
- Create: `components/chat/ChatWindow.tsx`

- [ ] **Step 1: MessageBubble 컴포넌트**

`components/chat/MessageBubble.tsx`:

```typescript
import type { Message } from '@/types'

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: ChatInput 컴포넌트**

`components/chat/ChatInput.tsx`:

```typescript
'use client'

import { useState, useRef } from 'react'

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end p-4 border-t border-gray-200 bg-white">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={disabled}
        rows={1}
        placeholder="무엇이든 질문해보세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
        className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 max-h-32 overflow-y-auto"
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="bg-indigo-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 shrink-0"
      >
        전송
      </button>
    </form>
  )
}
```

- [ ] **Step 3: ChatWindow 컴포넌트**

`components/chat/ChatWindow.tsx`:

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import type { Message } from '@/types'

interface Props {
  conversationId: string
}

export default function ChatWindow({ conversationId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }
    loadMessages()
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  async function handleSend(content: string) {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    setStreaming(true)
    setStreamingText('')

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, content }),
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            const assistantMessage: Message = {
              id: crypto.randomUUID(),
              conversation_id: conversationId,
              role: 'assistant',
              content: fullText,
              created_at: new Date().toISOString(),
            }
            setMessages(prev => [...prev, assistantMessage])
            setStreamingText('')
            setStreaming(false)
          } else {
            try {
              const { text } = JSON.parse(data)
              fullText += text
              setStreamingText(fullText)
            } catch {}
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-16">
            <p className="text-lg font-medium">AI 튜터와 대화를 시작하세요</p>
            <p className="text-sm mt-2">디자인씽킹, AI 활용에 대해 무엇이든 물어보세요</p>
          </div>
        )}
        {messages.map(m => <MessageBubble key={m.id} message={m} />)}
        {streaming && streamingText && (
          <MessageBubble
            message={{
              id: 'streaming',
              conversation_id: conversationId,
              role: 'assistant',
              content: streamingText,
              created_at: '',
            }}
          />
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add components/
git commit -m "feat: add chat UI components (MessageBubble, ChatInput, ChatWindow)"
```

---

## Task 9: 채팅 페이지

**Files:**
- Create: `app/chat/page.tsx`
- Create: `app/chat/[id]/page.tsx`

- [ ] **Step 1: 채팅 목록/신규 페이지**

`app/chat/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Conversation } from '@/types'

export default function ChatListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch('/api/conversations').then(r => r.json()).then(setConversations)
  }, [])

  async function startNew() {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '새 대화' }),
    })
    const conv = await res.json()
    router.push(`/chat/${conv.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">대화 목록</h1>
        <button
          onClick={startNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          새 대화 시작
        </button>
      </div>

      {conversations.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p>아직 대화가 없습니다.</p>
          <p className="text-sm mt-1">위 버튼을 눌러 AI 튜터와 첫 대화를 시작해보세요.</p>
        </div>
      )}

      <div className="space-y-2">
        {conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => router.push(`/chat/${conv.id}`)}
            className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
          >
            <p className="font-medium text-gray-900 text-sm">{conv.title}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(conv.updated_at).toLocaleDateString('ko-KR')}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 개별 대화 페이지**

`app/chat/[id]/page.tsx`:

```typescript
import ChatWindow from '@/components/chat/ChatWindow'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <a href="/chat" className="text-gray-500 hover:text-gray-900 text-sm">← 목록</a>
        <span className="text-gray-300">|</span>
        <a href="/" className="text-gray-500 hover:text-gray-900 text-sm">홈</a>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatWindow conversationId={id} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 개발 서버에서 채팅 흐름 확인**

```bash
npm run dev
```

1. `http://localhost:3000/chat` 접속
2. "새 대화 시작" 클릭 → 채팅 페이지 이동
3. 메시지 전송 → AI 튜터 스트리밍 응답 확인

- [ ] **Step 4: 커밋**

```bash
git add app/chat/
git commit -m "feat: add chat list and individual chat pages"
```

---

## Task 10: 홈 대시보드

**Files:**
- Create: `app/page.tsx`
- Create: `app/api/topics/route.ts`

- [ ] **Step 1: Topics API**

`app/api/topics/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('user_id', user.id)
    .order('count', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: 홈 대시보드 페이지**

`app/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: conversations }, { data: topics }] = await Promise.all([
    supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(3),
    supabase
      .from('topics')
      .select('*')
      .eq('user_id', user.id)
      .order('count', { ascending: false })
      .limit(6),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="font-bold text-gray-900">AI 학습 플랫폼</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/chat" className="text-indigo-600 hover:text-indigo-800 font-medium">AI 튜터</Link>
          <Link href="/profile" className="text-gray-600 hover:text-gray-900">내 학습</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* 환영 메시지 */}
        <div className="bg-indigo-600 text-white rounded-2xl p-6">
          <p className="text-indigo-200 text-sm mb-1">안녕하세요!</p>
          <h2 className="text-xl font-bold">오늘도 탐구를 시작해볼까요?</h2>
          <Link
            href="/chat"
            className="mt-4 inline-block bg-white text-indigo-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-50"
          >
            AI 튜터와 대화하기 →
          </Link>
        </div>

        {/* 최근 대화 */}
        {conversations && conversations.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">최근 대화</h3>
            <div className="space-y-2">
              {conversations.map(conv => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className="block p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 text-sm"
                >
                  <span className="font-medium text-gray-900">{conv.title}</span>
                  <span className="text-gray-400 text-xs ml-2">
                    {new Date(conv.updated_at).toLocaleDateString('ko-KR')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 관심 주제 태그 */}
        {topics && topics.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">내가 탐구 중인 주제</h3>
            <div className="flex flex-wrap gap-2">
              {topics.map(topic => (
                <span
                  key={topic.id}
                  className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-xs font-medium"
                >
                  {topic.tag} <span className="text-indigo-400">({topic.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx app/api/topics/
git commit -m "feat: add home dashboard with recent conversations and topic tags"
```

---

## Task 11: 내 학습 현황 페이지

**Files:**
- Create: `app/profile/page.tsx`

- [ ] **Step 1: 내 학습 현황 페이지**

`app/profile/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: topics },
    { count: conversationCount },
    { count: messageCount },
  ] = await Promise.all([
    supabase
      .from('topics')
      .select('*')
      .eq('user_id', user.id)
      .order('count', { ascending: false }),
    supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('messages')
      .select('conversations!inner(user_id)', { count: 'exact', head: true })
      .eq('conversations.user_id', user.id)
      .eq('role', 'user'),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm">← 홈</Link>
        <h1 className="font-bold text-gray-900">내 학습 현황</h1>
        <div />
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">{conversationCount ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">총 대화 수</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">{messageCount ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">내가 보낸 메시지</p>
          </div>
        </div>

        {/* 탐구 주제 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">탐구한 주제</h3>
          {topics && topics.length > 0 ? (
            <div className="space-y-3">
              {topics.map(topic => (
                <div key={topic.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{topic.tag}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${Math.min((topic.count / (topics[0]?.count || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{topic.count}회</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              AI 튜터와 대화를 나누면 탐구 주제가 자동으로 분석됩니다.
            </p>
          )}
        </div>

        <Link
          href="/chat"
          className="block text-center bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700"
        >
          AI 튜터와 대화 계속하기
        </Link>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: 전체 테스트 실행**

```bash
npm run test:run
```

Expected: 모든 테스트 PASS

- [ ] **Step 3: 커밋**

```bash
git add app/profile/
git commit -m "feat: add learning profile page with topic statistics"
```

---

## Task 12: Vercel 배포

**Files:**
- Create: `vercel.json` (필요 시)

- [ ] **Step 1: 환경 변수 확인**

`.env.local`에 아래 값이 설정되어 있는지 확인:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 오류 없음

- [ ] **Step 3: GitHub에 최신 코드 push**

```bash
git push origin master
```

- [ ] **Step 4: Vercel 배포 설정**

1. [vercel.com](https://vercel.com) 접속 → "Add New Project"
2. GitHub `sungwookjang80/github80` 레포 선택
3. Framework: Next.js 자동 감지 확인
4. Environment Variables에 아래 3개 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
5. "Deploy" 클릭

- [ ] **Step 5: 배포 URL 확인**

배포 완료 후 `https://github80-xxxx.vercel.app` 형태의 URL로 접속 확인.
이후 push 시 자동 재배포.

---

## 전체 테스트 명령

```bash
npm run test:run
```

## 로컬 개발 서버

```bash
npm run dev
# http://localhost:3000
```
