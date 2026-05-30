import { google } from 'googleapis'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!

export async function appendUserToSheet(name: string, email: string) {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!key || !SPREADSHEET_ID) return

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(key),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({ version: 'v4', auth })

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A:C',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[name, email, new Date().toLocaleString('ko-KR')]],
    },
  })
}
