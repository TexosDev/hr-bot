import { supabase } from './supabase.js';
import { google } from 'googleapis';

// Инициализация Google API
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheetsService = google.sheets({ version: 'v4', auth });
const VACANCIES_SHEET_ID = process.env.GOOGLE_VACANCIES_SHEET_ID || process.env.GOOGLE_SHEET_ID;

// Синхронизация вакансий из Google Sheets в Supabase
export async function syncVacanciesFromSheetsToSupabase() {
  try {
    console.log(' Синхронизация вакансий из Google Sheets в Supabase...');
    
    // Получаем данные из Google Sheets
    const response = await sheetsService.spreadsheets.values.get({
      spreadsheetId: VACANCIES_SHEET_ID,
      range: 'A:I' // Название, Описание, Эмодзи, Категория, Ссылка, Уровень, Зарплата, Требования, Преимущества
    });
    
    const rows = response.data.values || [];
    console.log(` Получено ${rows.length} строк из Google Sheets`);
    
    if (rows.length <= 1) {
      console.log(' Нет данных для синхронизации');
      return { success: true, synced: 0 };
    }
    
    // Пропускаем заголовок
    const vacancies = rows.slice(1).map((row, index) => ({
      title: row[0] || '',
      description: row[1] || '',
      emoji: row[2] || '�',
      category: row[3] || 'Общее',
      link: row[4] || '',
      level: row[5] || '',
      salary: row[6] || '',
      requirements: row[7] || '',
      benefits: row[8] || '',
      is_active: true
    })).filter(v => v.title); // Фильтруем пустые строки
    
    console.log(` Найдено ${vacancies.length} вакансий для синхронизации`);
    
    if (vacancies.length === 0) {
      return { success: true, synced: 0 };
    }
    
    // Получаем существующие вакансии из Supabase
    const { data: existingVacancies, error: fetchError } = await supabase
      .from('vacancies')
      .select('title, category');
    
    if (fetchError) {
      console.error(' Ошибка получения существующих вакансий:', fetchError);
      return { success: false, error: fetchError };
    }
    
    // Создаем мапу существующих вакансий
    const existingMap = new Map();
    existingVacancies.forEach(v => {
      existingMap.set(`${v.title}_${v.category}`, true);
    });
    
    let syncedCount = 0;
    let updatedCount = 0;
    
    // Синхронизируем каждую вакансию
    for (const vacancy of vacancies) {
      const key = `${vacancy.title}_${vacancy.category}`;
      
      if (existingMap.has(key)) {
        // Обновляем существующую вакансию
        const { error: updateError } = await supabase
          .from('vacancies')
          .update(vacancy)
          .eq('title', vacancy.title)
          .eq('category', vacancy.category);
        
        if (updateError) {
          console.error(` Ошибка обновления вакансии ${vacancy.title}:`, updateError);
        } else {
          updatedCount++;
          console.log(` Обновлена вакансия: ${vacancy.title}`);
        }
      } else {
        // Добавляем новую вакансию
        const { error: insertError } = await supabase
          .from('vacancies')
          .insert([vacancy]);
        
        if (insertError) {
          console.error(` Ошибка добавления вакансии ${vacancy.title}:`, insertError);
        } else {
          syncedCount++;
          console.log(` Добавлена новая вакансия: ${vacancy.title}`);
        }
      }
    }
    
    console.log(` Синхронизация завершена: ${syncedCount} новых, ${updatedCount} обновленных`);
    return { success: true, synced: syncedCount, updated: updatedCount };
    
  } catch (error) {
    console.error(' Ошибка синхронизации вакансий:', error);
    return { success: false, error: error.message };
  }
}

// Синхронизация подписок из Supabase в Google Sheets
export async function syncSubscriptionsFromSupabaseToSheets() {
  try {
    console.log(' Синхронизация подписок из Supabase в Google Sheets...');
    
    // Получаем подписки из Supabase
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(' Ошибка получения подписок:', error);
      return { success: false, error: error.message };
    }
    
    console.log(` Получено ${subscriptions.length} подписок из Supabase`);
    
    if (subscriptions.length === 0) {
      return { success: true, synced: 0 };
    }
    
    // Подготавливаем данные для Google Sheets
    const rows = subscriptions.map(sub => [
      sub.created_at,
      sub.user_id,
      sub.username,
      sub.category
    ]);
    
    // Очищаем лист подписок и добавляем заголовки
    await sheetsService.spreadsheets.values.clear({
      spreadsheetId: VACANCIES_SHEET_ID,
      range: 'Subscriptions!A:D'
    });
    
    // Добавляем заголовки
    await sheetsService.spreadsheets.values.update({
      spreadsheetId: VACANCIES_SHEET_ID,
      range: 'Subscriptions!A1:D1',
      valueInputOption: 'RAW',
      resource: {
        values: [['Дата', 'User ID', 'Username', 'Категория']]
      }
    });
    
    // Добавляем данные
    if (rows.length > 0) {
      await sheetsService.spreadsheets.values.update({
        spreadsheetId: VACANCIES_SHEET_ID,
        range: 'Subscriptions!A2:D' + (rows.length + 1),
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      });
    }
    
    console.log(` Синхронизировано ${rows.length} подписок в Google Sheets`);
    return { success: true, synced: rows.length };
    
  } catch (error) {
    console.error(' Ошибка синхронизации подписок:', error);
    return { success: false, error: error.message };
  }
}

// Полная синхронизация
export async function fullSync() {
  try {
    console.log(' Запуск полной синхронизации...');
    
    // 1. Синхронизируем вакансии из Google Sheets в Supabase
    const vacanciesResult = await syncVacanciesFromSheetsToSupabase();
    
    // 2. Синхронизируем подписки из Supabase в Google Sheets
    const subscriptionsResult = await syncSubscriptionsFromSupabaseToSheets();
    
    console.log(' Полная синхронизация завершена!');
    console.log(` Результаты:`);
    console.log(`  - Вакансии: ${vacanciesResult.synced} новых, ${vacanciesResult.updated} обновленных`);
    console.log(`  - Подписки: ${subscriptionsResult.synced} синхронизированных`);
    
    return {
      success: true,
      vacancies: vacanciesResult,
      subscriptions: subscriptionsResult
    };
    
  } catch (error) {
    console.error(' Ошибка полной синхронизации:', error);
    return { success: false, error: error.message };
  }
}
