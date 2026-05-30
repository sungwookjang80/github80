/**
 * Google Sheets Refresh Token 발급 스크립트 (1회만 실행)
 *
 * 실행 방법:
 * 1. .env.local에 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 입력
 * 2. node scripts/get-google-token.mjs
 * 3. 출력된 URL을 브라우저에서 열어 Google 계정으로 로그인
 * 4. 리디렉션 후 터미널에 refresh_token이 자동 출력됨
 * 5. 출력된 refresh_token을 Vercel 환경변수 GOOGLE_REFRESH_TOKEN에 저장
 */

import { readFileSync } from 'fs'
import { createServer } from 'http'
import { google } from 'googleapis'

// .env.local에서 값 읽기
let clientId, clientSecret
try {
  const env = readFileSync('.env.local', 'utf8')
  clientId = env.match(/GOOGLE_CLIENT_ID=(.+)/)?.[1]?.trim()
  clientSecret = env.match(/GOOGLE_CLIENT_SECRET=(.+)/)?.[1]?.trim()
} catch {
  console.error('.env.local 파일을 읽을 수 없습니다.')
  process.exit(1)
}

if (!clientId || !clientSecret) {
  console.error('.env.local에 GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET을 먼저 입력해주세요.')
  process.exit(1)
}

const PORT = 3333
const REDIRECT_URI = `http://localhost:${PORT}`

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/spreadsheets'],
  prompt: 'consent',
})

console.log('\n아래 URL을 브라우저에서 열어주세요:\n')
console.log(authUrl)
console.log('\n브라우저에서 허용하면 자동으로 토큰이 발급됩니다...\n')

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI)
  const code = url.searchParams.get('code')

  if (!code) {
    res.end('코드가 없습니다.')
    return
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    res.end('<h2>완료! 터미널로 돌아가세요.</h2>')
    server.close()

    console.log('\n✅ 아래 값을 Vercel 환경변수 GOOGLE_REFRESH_TOKEN에 추가하세요:\n')
    console.log(tokens.refresh_token)
    console.log('\n')
    process.exit(0)
  } catch (e) {
    res.end('토큰 발급 실패: ' + e.message)
    server.close()
    process.exit(1)
  }
})

server.listen(PORT)
