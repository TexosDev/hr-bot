import 'dotenv/config';
import { fullSync } from '../src/services/supabase/syncSheetsSupabase.js';

console.log('🔄 Синхронизация вакансий между Google Sheets и Supabase...');

async function main() {
  try {
    const result = await fullSync();
    
    if (result.success) {
      console.log('\n✅ Синхронизация успешно завершена!');
      console.log('📋 Теперь рекрутер может:');
      console.log('  1. Открыть Google Sheets');
      console.log('  2. Добавить новую вакансию в таблицу');
      console.log('  3. Запустить этот скрипт для синхронизации');
      console.log('  4. Вакансия появится в боте');
    } else {
      console.log('\n❌ Ошибка синхронизации:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

main();
