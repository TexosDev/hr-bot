import { google } from 'googleapis';

// Инициализация Google Sheets API
export function createSheetsService(auth) {
  return google.sheets({ version: 'v4', auth });
}

// Добавление строки в Google Sheets
export async function addRowToSheet(sheetsService, sheetId, range, rowData) {
  try {
    console.log(' Google Sheets - начало записи');
    console.log(' Sheet ID:', sheetId);
    console.log(' Range:', range);
    console.log(' Row data:', rowData);
    
    const result = await sheetsService.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [rowData] }
    });
    
    console.log(' Google Sheets - результат:', result.data);
    console.log(' Google Sheets - запись успешна');
  } catch (error) {
    console.error(' Google Sheets - ошибка:', error.message);
    console.error(' Google Sheets - полная ошибка:', error);
    throw new Error('Не удалось записать данные в Google Sheets');
  }
}
