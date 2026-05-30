import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다.' }, { status: 500 })
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || '' } },
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  } catch (e) {
    console.error('[Supabase] 회원가입 실패:', e)
    return NextResponse.json({ error: '회원가입에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
