import 'dotenv/config';
import { supabase } from '../src/services/supabase/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📊 Создание новых таблиц для системы с тегами...');

async function createTables() {
  try {
    // Читаем SQL схему
    const schemaPath = path.join(__dirname, '../database/new-subscription-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 SQL схема загружена');
    
    // Разбиваем на отдельные запросы
    const queries = schema
      .split(';')
      .map(q => q.trim())
      .filter(q => q && !q.startsWith('--'));
    
    console.log(`📋 Найдено ${queries.length} SQL запросов`);
    
    // Выполняем каждый запрос
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query) {
        try {
          console.log(`🔄 Выполнение запроса ${i + 1}...`);
          
          // Выполняем запрос через Supabase
          const { error } = await supabase.rpc('exec_sql', { sql: query });
          
          if (error) {
            console.error(`❌ Ошибка в запросе ${i + 1}:`, error.message);
            // Продолжаем выполнение других запросов
          } else {
            console.log(`✅ Запрос ${i + 1} выполнен`);
          }
        } catch (err) {
          console.error(`❌ Ошибка выполнения запроса ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Создание таблиц завершено!');
    
    // Проверяем созданные таблицы
    console.log('\n🔍 Проверка созданных таблиц...');
    
    const tables = [
      'vacancies',
      'user_preferences', 
      'notifications',
      'tags',
      'vacancy_tags',
      'user_tags'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Таблица ${table}: ${error.message}`);
        } else {
          console.log(`✅ Таблица ${table}: создана`);
        }
      } catch (err) {
        console.log(`❌ Таблица ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

createTables();
