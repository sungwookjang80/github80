import { google } from 'googleapis'

const SPREADSHEET_ID = '1S3bVyDwAwRFjiQifVG8iJcZ3epZJqSQg1xj-aNKJ-ZY'

export async function appendUserToSheet(name: string, email: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[Sheets] 환경변수 미설정, 건너뜀')
    return
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob')
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A:C',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[name, email, new Date().toLocaleString('ko-KR')]],
    },
  })
}
