import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL и SUPABASE_ANON_KEY должны быть установлены в .env');
  console.error('💡 Текущие значения:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅ установлен' : '❌ не найден');
  console.error('   SUPABASE_ANON_KEY:', supabaseKey ? '✅ установлен' : '❌ не найден');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Проверка подключения к Supabase
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('vacancies').select('count').limit(1);
    if (error) {
      console.error('❌ Ошибка подключения к Supabase:', error);
      return false;
    }
    console.log('✅ Подключение к Supabase успешно');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к Supabase:', error);
    return false;
  }
}

// Экспорт для использования в других модулях
export default supabase;
