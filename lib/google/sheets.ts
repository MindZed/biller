"use server"

import { google } from "googleapis"
import { prisma } from "../prisma"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
)

async function getGoogleAuthClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" }
  })

  if (!account || !account.refresh_token) {
    throw new Error("No Google account or refresh token found for this user.")
  }

  oauth2Client.setCredentials({
    refresh_token: account.refresh_token
  })

  return oauth2Client
}

export async function createBudgetSheet(userId: string, budgetName: string, type: string) {
  const auth = await getGoogleAuthClient(userId)
  const sheets = google.sheets({ version: "v4", auth })
  const drive = google.drive({ version: "v3", auth })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  let sheetId = user?.activeSheetId

  // 1. Create master sheet if it doesn't exist
  if (!sheetId) {
    const newSheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: "Cost Ledger App Data"
        }
      }
    })
    sheetId = newSheet.data.spreadsheetId!
    
    // Save master sheet ID
    await prisma.user.update({
      where: { id: userId },
      data: { activeSheetId: sheetId }
    })
  }

  // 2. Add new Tab for the budget
  // Note: we might get an error if the tab already exists, so we wrap it
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: budgetName
              }
            }
          }
        ]
      }
    })
  } catch (err: any) {
    // If it exists, that's fine, we'll just ensure headers
    if (!err.message.includes("already exists")) {
      throw err
    }
  }

  // 3. Add header row
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `'${budgetName}'!A1:G1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        ['Date', 'Category', 'Note', 'Amount', 'Friend ID', 'Split Mode', 'Entry ID']
      ]
    }
  })

  return { sheetId, tabName: budgetName }
}

export async function appendSpendRow(userId: string, spendData: any, tabName: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.activeSheetId) throw new Error("No active sheet connected.")

  const auth = await getGoogleAuthClient(userId)
  const sheets = google.sheets({ version: "v4", auth })

  const dateStr = new Date(spendData.timestamp).toLocaleString()

  const entryId = String(spendData.sheetEntryId ?? spendData.id ?? '')
  const rowData = [
    dateStr,
    spendData.category,
    spendData.note || '',
    spendData.amount,
    spendData.friendId || '',
    spendData.splitMode || '',
    entryId
  ]

  if (entryId) {
    const existingIds = await sheets.spreadsheets.values.get({
      spreadsheetId: user.activeSheetId,
      range: `'${tabName}'!G:G`
    })

    const rows = existingIds.data.values || []
    const rowIndex = rows.findIndex((row, idx) => idx !== 0 && row?.[0] === entryId)

    if (rowIndex !== -1) {
      const targetRow = rowIndex + 1
      await sheets.spreadsheets.values.update({
        spreadsheetId: user.activeSheetId,
        range: `'${tabName}'!A${targetRow}:G${targetRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [rowData]
        }
      })
      return { success: true }
    }
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: user.activeSheetId,
    range: `'${tabName}'!A:G`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [rowData]
    }
  })

  return { success: true }
}
