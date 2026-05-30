-- profiles 테이블 (auth.users 확장)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  created_at timestamptz default now()
);

-- conversations 테이블 (auth.users 직접 참조)
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
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
  user_id uuid references auth.users(id) on delete cascade not null,
  tag text not null,
  count integer default 1,
  last_seen_at timestamptz default now(),
  unique(user_id, tag)
);

-- assessments 테이블 (레벨테스트 결과)
create table if not exists public.assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  level integer not null,
  title text not null,
  summary text not null,
  strengths text[] default '{}',
  growth_areas text[] default '{}',
  feedback text,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.topics enable row level security;
alter table public.assessments enable row level security;

-- 기존 정책 삭제 후 재생성 (중복 방지)
drop policy if exists "profiles: own data" on public.profiles;
drop policy if exists "conversations: own data" on public.conversations;
drop policy if exists "messages: own conversations" on public.messages;
drop policy if exists "topics: own data" on public.topics;
drop policy if exists "assessments: own data" on public.assessments;

-- RLS 정책
create policy "profiles: own data" on public.profiles for all using (auth.uid() = id);
create policy "conversations: own data" on public.conversations for all using (auth.uid() = user_id);
create policy "messages: own conversations" on public.messages for all
  using (exists (select 1 from public.conversations where id = conversation_id and user_id = auth.uid()));
create policy "topics: own data" on public.topics for all using (auth.uid() = user_id);
create policy "assessments: own data" on public.assessments for all using (auth.uid() = user_id);

-- 신규 가입 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
