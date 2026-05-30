import { appendUserToSheet } from '@/lib/sheets'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
  }

  // Supabase 회원가입 (설정된 경우)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
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
    }
  }

  // Google Sheets 기록 (항상 시도)
  try {
    await appendUserToSheet(name || '', email)
  } catch (e) {
    console.error('[Sheets] 기록 실패:', e)
    return NextResponse.json({ error: 'Google Sheets 기록에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
