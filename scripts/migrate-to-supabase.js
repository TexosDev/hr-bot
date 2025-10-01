import 'dotenv/config';
import { google } from 'googleapis';
import { supabase } from '../src/services/supabase/supabase.js';
import { getVacanciesFromSheet } from '../src/services/vacancies.js';
import { getSubscriptionsFromSheet } from '../src/services/subscriptions.js';

// Инициализация Google API
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheetsService = google.sheets({ version: 'v4', auth });
const VACANCIES_SHEET_ID = process.env.GOOGLE_VACANCIES_SHEET_ID || process.env.GOOGLE_SHEET_ID;
const RESPONSES_SHEET_ID = process.env.GOOGLE_RESPONSES_SHEET_ID || process.env.GOOGLE_SHEET_ID;

console.log('🔄 Миграция данных из Google Sheets в Supabase...');

async function migrateVacancies() {
  try {
    console.log('\n1. Миграция вакансий...');
    
    // Получаем вакансии из Google Sheets
    const vacancies = await getVacanciesFromSheet(sheetsService, VACANCIES_SHEET_ID);
    console.log(`📋 Найдено ${vacancies.length} вакансий в Google Sheets`);
    
    if (vacancies.length === 0) {
      console.log('⚠️ Нет вакансий для миграции');
      return;
    }
    
    // Преобразуем данные для Supabase
    const supabaseVacancies = vacancies.map(vacancy => ({
      title: vacancy.title,
      description: vacancy.description,
      emoji: vacancy.emoji,
      category: vacancy.category,
      link: vacancy.link,
      level: vacancy.level,
      salary: vacancy.salary,
      requirements: vacancy.requirements,
      benefits: vacancy.benefits,
      is_active: true
    }));
    
    // Вставляем в Supabase
    const { data, error } = await supabase
      .from('vacancies')
      .insert(supabaseVacancies)
      .select();
    
    if (error) {
      console.error('❌ Ошибка миграции вакансий:', error);
      return;
    }
    
    console.log(`✅ Мигрировано ${data.length} вакансий в Supabase`);
    
  } catch (error) {
    console.error('❌ Ошибка миграции вакансий:', error);
  }
}

async function migrateSubscriptions() {
  try {
    console.log('\n2. Миграция подписок...');
    
    // Получаем подписки из Google Sheets
    const subscriptions = await getSubscriptionsFromSheet(sheetsService, RESPONSES_SHEET_ID);
    console.log(`📋 Найдено ${subscriptions.length} подписок в Google Sheets`);
    
    if (subscriptions.length === 0) {
      console.log('⚠️ Нет подписок для миграции');
      return;
    }
    
    // Преобразуем данные для Supabase
    const supabaseSubscriptions = subscriptions.map(subscription => ({
      user_id: parseInt(subscription.userId),
      username: subscription.username,
      category: subscription.category
    }));
    
    // Вставляем в Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(supabaseSubscriptions)
      .select();
    
    if (error) {
      console.error('❌ Ошибка миграции подписок:', error);
      return;
    }
    
    console.log(`✅ Мигрировано ${data.length} подписок в Supabase`);
    
  } catch (error) {
    console.error('❌ Ошибка миграции подписок:', error);
  }
}

async function migrateResponses() {
  try {
    console.log('\n3. Миграция откликов...');
    
    // Получаем отклики из Google Sheets
    const { data: responsesData, error } = await sheetsService.spreadsheets.values.get({
      spreadsheetId: RESPONSES_SHEET_ID,
      range: 'A:L'
    });
    
    if (error) {
      console.error('❌ Ошибка получения откликов:', error);
      return;
    }
    
    const rows = responsesData.values || [];
    console.log(`📋 Найдено ${rows.length - 1} откликов в Google Sheets`);
    
    if (rows.length <= 1) {
      console.log('⚠️ Нет откликов для миграции');
      return;
    }
    
    // Пропускаем заголовок
    const responses = rows.slice(1).map(row => ({
      user_id: parseInt(row[1]) || 0,
      username: row[2] || '',
      first_name: row[3] || '',
      email: row[4] || '',
      phone: row[5] || '',
      file_name: row[6] || '',
      file_mime: row[7] || '',
      telegram_link: row[8] || '',
      status: row[9] || 'new',
      vacancy_title: row[10] || '',
      text_preview: row[11] || '',
      created_at: row[0] || new Date().toISOString()
    })).filter(r => r.user_id > 0);
    
    if (responses.length === 0) {
      console.log('⚠️ Нет валидных откликов для миграции');
      return;
    }
    
    // Вставляем в Supabase
    const { data, error: insertError } = await supabase
      .from('responses')
      .insert(responses)
      .select();
    
    if (insertError) {
      console.error('❌ Ошибка миграции откликов:', insertError);
      return;
    }
    
    console.log(`✅ Мигрировано ${data.length} откликов в Supabase`);
    
  } catch (error) {
    console.error('❌ Ошибка миграции откликов:', error);
  }
}

async function main() {
  try {
    // Проверяем подключение к Supabase
    console.log('🔍 Проверка подключения к Supabase...');
    const { data, error } = await supabase.from('vacancies').select('count').limit(1);
    if (error) {
      console.error('❌ Ошибка подключения к Supabase:', error);
      return;
    }
    console.log('✅ Подключение к Supabase успешно');
    
    // Мигрируем данные
    await migrateVacancies();
    await migrateSubscriptions();
    await migrateResponses();
    
    console.log('\n🎉 Миграция завершена!');
    console.log('📋 Теперь можно использовать Supabase вместо Google Sheets');
    
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
  }
}

main();
