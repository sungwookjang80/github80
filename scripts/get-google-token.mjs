/**
 * Google Sheets Refresh Token 발급 스크립트 (1회만 실행)
 *
 * 실행 방법:
 * 1. .env.local에 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 입력
 * 2. node scripts/get-google-token.mjs
 * 3. 출력된 URL을 브라우저에서 열어 Google 계정으로 로그인
 * 4. 허용 후 나오는 코드를 터미널에 붙여넣기
 * 5. 출력된 refresh_token을 Vercel 환경변수 GOOGLE_REFRESH_TOKEN에 저장
 */

import { readFileSync } from 'fs'
import { createInterface } from 'readline'
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

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob')

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/spreadsheets'],
  prompt: 'consent',
})

console.log('\n아래 URL을 브라우저에서 열어주세요:\n')
console.log(authUrl)
console.log('\n')

const rl = createInterface({ input: process.stdin, output: process.stdout })
rl.question('브라우저에서 허용 후 나오는 코드를 붙여넣으세요: ', async (code) => {
  rl.close()
  const { tokens } = await oauth2Client.getToken(code.trim())
  console.log('\n✅ 아래 값을 Vercel 환경변수 GOOGLE_REFRESH_TOKEN에 추가하세요:\n')
  console.log(tokens.refresh_token)
  console.log('\n')
})
