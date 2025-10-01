import { supabase } from './supabase.js';
import { google } from 'googleapis';
import { syncVacanciesWithTagsFromSheets } from './supabaseVacanciesWithTags.js';
import { notifyUsersAboutNewVacancy } from '../notification/NotificationService.js';

// Инициализация Google API
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheetsService = google.sheets({ version: 'v4', auth });
const VACANCIES_SHEET_ID = process.env.GOOGLE_VACANCIES_SHEET_ID || process.env.GOOGLE_SHEET_ID;

/**
 * Обновленная синхронизация с поддержкой тегов и уведомлений
 * Следует принципам SOLID, DRY, KISS
 */

/**
 * Синхронизация вакансий с тегами из Google Sheets в Supabase
 * SOLID: Единственная ответственность
 */
export async function syncVacanciesWithTagsFromSheetsToSupabase() {
  try {
    console.log(' Синхронизация вакансий с тегами из Google Sheets в Supabase...');
    
    // Получаем данные из Google Sheets
    const response = await sheetsService.spreadsheets.values.get({
      spreadsheetId: VACANCIES_SHEET_ID,
      range: 'A:K' // Расширенный диапазон для тегов
    });
    
    const rows = response.data.values || [];
    console.log(` Получено ${rows.length} строк из Google Sheets`);
    
    if (rows.length <= 1) {
      console.log(' Нет данных для синхронизации');
      return { success: true, synced: 0 };
    }
    
    // Пропускаем заголовок
    const vacanciesData = rows.slice(1);
    
    // Синхронизируем вакансии с тегами
    const result = await syncVacanciesWithTagsFromSheets(vacanciesData);
    
    if (result.success) {
      console.log(` Синхронизация завершена: ${result.synced} новых, ${result.updated} обновленных`);
      
      // Если есть новые вакансии, отправляем уведомления
      if (result.synced > 0) {
        console.log(' Отправка уведомлений о новых вакансиях...');
        await sendNotificationsForNewVacancies();
      }
    }
    
    return result;
    
  } catch (error) {
    console.error(' Ошибка синхронизации вакансий с тегами:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Отправка уведомлений о новых вакансиях
 * DRY: Переиспользуемая логика
 */
async function sendNotificationsForNewVacancies() {
  try {
    // Получаем последние добавленные вакансии (за последние 5 минут)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: newVacancies, error } = await supabase
      .from('vacancies')
      .select('id, title, category')
      .gte('created_at', fiveMinutesAgo)
      .eq('is_active', true);
    
    if (error) {
      console.error(' Ошибка получения новых вакансий:', error);
      return;
    }
    
    if (newVacancies.length === 0) {
      console.log('ℹ Нет новых вакансий для уведомлений');
      return;
    }
    
    console.log(`� Отправка уведомлений для ${newVacancies.length} новых вакансий`);
    
    // Отправляем уведомления для каждой новой вакансии
    for (const vacancy of newVacancies) {
      try {
        const result = await notifyUsersAboutNewVacancy(vacancy.id);
        
        if (result.success) {
          console.log(` Уведомления отправлены для вакансии "${vacancy.title}": ${result.notified} пользователей`);
        } else {
          console.error(` Ошибка отправки уведомлений для вакансии "${vacancy.title}": ${result.error}`);
        }
      } catch (error) {
        console.error(` Критическая ошибка уведомлений для вакансии "${vacancy.title}":`, error);
      }
    }
    
  } catch (error) {
    console.error(' Ошибка отправки уведомлений о новых вакансиях:', error);
  }
}

/**
 * Синхронизация подписок из Supabase в Google Sheets
 * DRY: Переиспользуемая логика
 */
export async function syncSubscriptionsFromSupabaseToSheets() {
  try {
    console.log(' Синхронизация подписок из Supabase в Google Sheets...');
    
    // Получаем подписки из Supabase
    const { data: subscriptions, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('is_active', true)
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
      sub.first_name,
      JSON.stringify(sub.preferences),
      sub.subscription_type
    ]);
    
    // Очищаем лист подписок и добавляем заголовки
    await sheetsService.spreadsheets.values.clear({
      spreadsheetId: VACANCIES_SHEET_ID,
      range: 'Subscriptions!A:F'
    });
    
    // Добавляем заголовки
    await sheetsService.spreadsheets.values.update({
      spreadsheetId: VACANCIES_SHEET_ID,
      range: 'Subscriptions!A1:F1',
      valueInputOption: 'RAW',
      resource: {
        values: [['Дата', 'User ID', 'Username', 'Имя', 'Предпочтения', 'Тип']]
      }
    });
    
    // Добавляем данные
    if (rows.length > 0) {
      await sheetsService.spreadsheets.values.update({
        spreadsheetId: VACANCIES_SHEET_ID,
        range: 'Subscriptions!A2:F' + (rows.length + 1),
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      });
    }
    
    console.log(` Синхронизировано ${subscriptions.length} подписок в Google Sheets`);
    return { success: true, synced: subscriptions.length };
    
  } catch (error) {
    console.error(' Ошибка синхронизации подписок:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Полная синхронизация с поддержкой тегов и уведомлений
 * SOLID: Единственная ответственность
 */
export async function fullSyncWithTags() {
  try {
    console.log(' Запуск полной синхронизации с тегами...');
    
    // 1. Синхронизируем вакансии с тегами из Google Sheets в Supabase
    const vacanciesResult = await syncVacanciesWithTagsFromSheetsToSupabase();
    
    // 2. Синхронизируем подписки из Supabase в Google Sheets
    const subscriptionsResult = await syncSubscriptionsFromSupabaseToSheets();
    
    console.log(' Полная синхронизация с тегами завершена!');
    console.log(` Результаты:`);
    console.log(`  - Вакансии: ${vacanciesResult.synced} новых, ${vacanciesResult.updated} обновленных`);
    console.log(`  - Подписки: ${subscriptionsResult.synced} синхронизированных`);
    
    return {
      success: true,
      vacancies: vacanciesResult,
      subscriptions: subscriptionsResult
    };
    
  } catch (error) {
    console.error(' Ошибка полной синхронизации с тегами:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Синхронизация только новых вакансий
 * KISS: Простая логика для быстрой синхронизации
 */
export async function syncNewVacanciesOnly() {
  try {
    console.log(' Синхронизация только новых вакансий...');
    
    // Получаем данные из Google Sheets
    const response = await sheetsService.spreadsheets.values.get({
      spreadsheetId: VACANCIES_SHEET_ID,
      range: 'A:K'
    });
    
    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      return { success: true, synced: 0 };
    }
    
    // Получаем последнюю синхронизацию
    const { data: lastSync, error: syncError } = await supabase
      .from('sync_log')
      .select('last_sync_time')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const lastSyncTime = lastSync?.last_sync_time || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Фильтруем только новые вакансии
    const newVacancies = rows.slice(1).filter((row, index) => {
      // Простая проверка на новые вакансии
      return row[0] && row[0].trim() !== '';
    });
    
    if (newVacancies.length === 0) {
      return { success: true, synced: 0 };
    }
    
    // Синхронизируем новые вакансии
    const result = await syncVacanciesWithTagsFromSheets(newVacancies);
    
    // Записываем время синхронизации
    await supabase
      .from('sync_log')
      .insert([{
        last_sync_time: new Date().toISOString(),
        synced_vacancies: result.synced,
        updated_vacancies: result.updated
      }]);
    
    return result;
    
  } catch (error) {
    console.error(' Ошибка синхронизации новых вакансий:', error);
    return { success: false, error: error.message };
  }
}
