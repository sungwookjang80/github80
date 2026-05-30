import { createClient } from '@/lib/supabase/server'
import { appendUserToSheet } from '@/lib/sheets'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name || '' } },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Google Sheets에 기록 (실패해도 회원가입은 완료)
  try {
    await appendUserToSheet(name || '', email)
  } catch (e) {
    console.error('[Sheets] 기록 실패:', e)
  }

  return NextResponse.json({ success: true })
}
