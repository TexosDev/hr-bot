import 'dotenv/config';
import { supabase } from '../src/services/supabase/supabase.js';

console.log('🔍 Проверка существующих таблиц...');

const tables = [
  'vacancies',
  'user_preferences', 
  'notifications',
  'tags',
  'vacancy_tags',
  'user_tags'
];

async function checkTables() {
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Таблица ${table}: ${error.message}`);
      } else {
        console.log(`✅ Таблица ${table}: существует`);
      }
    } catch (err) {
      console.log(`❌ Таблица ${table}: ${err.message}`);
    }
  }
}

checkTables();
