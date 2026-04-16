import { google } from "googleapis";

export async function syncStockSheetRows(input: {
  rows: Array<[string, string, string]>;
  organizationId: string;
}) {
  const sheetId = process.env.GOOGLE_SHEETS_SHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!sheetId || !serviceAccountEmail || !privateKey) {
    return { skipped: true, rows: input.rows };
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "Stock!A:C",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: input.rows },
  });

  return { skipped: false, rows: input.rows };
}