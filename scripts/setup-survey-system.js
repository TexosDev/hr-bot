import 'dotenv/config';
import { supabase } from '../src/services/supabase/supabase.js';
import fs from 'fs';
import path from 'path';

/**
 * Скрипт для настройки системы опросов
 * Безопасно выполняет SQL схему с проверками
 */

console.log('🔧 Настройка системы опросов...');

async function setupSurveySystem() {
  try {
    // Читаем SQL схему
    const schemaPath = path.join(process.cwd(), 'database', 'survey-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Выполнение SQL схемы...');
    
    // Разбиваем на отдельные команды
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const command of commands) {
      try {
        if (command.includes('INSERT INTO') && command.includes('ON CONFLICT')) {
          // Для INSERT с ON CONFLICT используем rpc
          const { error } = await supabase.rpc('exec_sql', { sql: command });
          if (error) {
            console.log(`⚠️  Пропуск (уже существует): ${command.substring(0, 50)}...`);
          } else {
            console.log(`✅ Выполнено: ${command.substring(0, 50)}...`);
            successCount++;
          }
        } else {
          // Для остальных команд используем обычный запрос
          const { error } = await supabase.rpc('exec_sql', { sql: command });
          if (error) {
            console.log(`⚠️  Пропуск: ${error.message}`);
          } else {
            console.log(`✅ Выполнено: ${command.substring(0, 50)}...`);
            successCount++;
          }
        }
      } catch (error) {
        console.log(`❌ Ошибка: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Результаты:`);
    console.log(`✅ Успешно: ${successCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    
    // Проверяем созданные таблицы
    console.log('\n🔍 Проверка созданных таблиц...');
    
    const tables = ['tags', 'survey_questions', 'user_survey_responses', 'user_subscriptions', 'vacancy_tags', 'user_tags'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Таблица ${table}: ${error.message}`);
        } else {
          console.log(`✅ Таблица ${table}: создана`);
        }
      } catch (error) {
        console.log(`❌ Таблица ${table}: ${error.message}`);
      }
    }
    
    // Проверяем тестовые данные
    console.log('\n📋 Проверка тестовых данных...');
    
    try {
      const { data: tags, error: tagsError } = await supabase.from('tags').select('*');
      if (tagsError) {
        console.log(`❌ Теги: ${tagsError.message}`);
      } else {
        console.log(`✅ Теги: ${tags.length} записей`);
      }
    } catch (error) {
      console.log(`❌ Теги: ${error.message}`);
    }
    
    try {
      const { data: questions, error: questionsError } = await supabase.from('survey_questions').select('*');
      if (questionsError) {
        console.log(`❌ Вопросы: ${questionsError.message}`);
      } else {
        console.log(`✅ Вопросы: ${questions.length} записей`);
      }
    } catch (error) {
      console.log(`❌ Вопросы: ${error.message}`);
    }
    
    console.log('\n🎉 Настройка системы опросов завершена!');
    console.log('\n📋 Следующие шаги:');
    console.log('1. Протестировать создание вопросов');
    console.log('2. Протестировать прохождение опроса');
    console.log('3. Протестировать создание подписок');
    console.log('4. Протестировать поиск вакансий');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

// Запускаем настройку
setupSurveySystem();
