import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('demo-user', '', { maxAge: 0, path: '/' })
  return response
}
