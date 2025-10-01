import 'dotenv/config';
import { supabase } from '../src/services/supabase/supabase.js';
import { fullSyncWithTags } from '../src/services/supabase/syncSheetsSupabaseWithTags.js';

/**
 * Скрипт миграции на новую систему подписок с тегами
 * Следует принципам SOLID, DRY, KISS
 */

console.log('🚀 Миграция на новую систему подписок с тегами...');

async function migrateDatabase() {
  try {
    console.log('📊 Создание новых таблиц...');
    
    // Читаем и выполняем SQL схему
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const schemaPath = path.join(__dirname, '../database/new-subscription-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Выполняем SQL
    const { error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error('❌ Ошибка создания таблиц:', error);
      return false;
    }
    
    console.log('✅ Таблицы созданы');
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка миграции базы данных:', error);
    return false;
  }
}

async function migrateExistingData() {
  try {
    console.log('📋 Миграция существующих данных...');
    
    // Получаем существующие подписки
    const { data: oldSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Ошибка получения старых подписок:', fetchError);
      return false;
    }
    
    console.log(`📊 Найдено ${oldSubscriptions.length} старых подписок`);
    
    // Мигрируем подписки в новую систему
    for (const subscription of oldSubscriptions) {
      try {
        // Создаем базовые предпочтения на основе категории
        const preferences = {
          directions: [subscription.category],
          technologies: [],
          experience: ['Любой'],
          salary: null,
          work_conditions: ['Любой формат'],
          location: 'Рассмотрю варианты',
          company_size: ['Не важно'],
          migrated_from: 'old_system',
          migrated_at: new Date().toISOString()
        };
        
        // Сохраняем в новую таблицу
        const { error: insertError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: subscription.user_id,
            username: subscription.username,
            first_name: subscription.username, // Используем username как имя
            preferences: preferences,
            is_active: true,
            subscription_type: 'migrated'
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });
        
        if (insertError) {
          console.error(`❌ Ошибка миграции подписки пользователя ${subscription.user_id}:`, insertError);
        } else {
          console.log(`✅ Мигрирована подписка пользователя ${subscription.user_id}`);
        }
        
      } catch (error) {
        console.error(`❌ Ошибка миграции подписки ${subscription.id}:`, error);
      }
    }
    
    console.log('✅ Миграция данных завершена');
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка миграции данных:', error);
    return false;
  }
}

async function testNewSystem() {
  try {
    console.log('🧪 Тестирование новой системы...');
    
    // Тестируем синхронизацию
    const syncResult = await fullSyncWithTags();
    
    if (syncResult.success) {
      console.log('✅ Синхронизация работает');
      console.log(`📊 Результаты: ${syncResult.vacancies.synced} новых, ${syncResult.vacancies.updated} обновленных`);
    } else {
      console.error('❌ Ошибка синхронизации:', syncResult.error);
      return false;
    }
    
    // Тестируем получение подписчиков
    const { data: subscribers, error: subscribersError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('is_active', true)
      .limit(5);
    
    if (subscribersError) {
      console.error('❌ Ошибка получения подписчиков:', subscribersError);
      return false;
    }
    
    console.log(`✅ Найдено ${subscribers.length} активных подписчиков`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Начинаем миграцию на новую систему подписок...\n');
    
    // Шаг 1: Создание новых таблиц
    console.log('📊 Шаг 1: Создание новых таблиц...');
    const dbResult = await migrateDatabase();
    if (!dbResult) {
      console.error('❌ Миграция прервана на этапе создания таблиц');
      return;
    }
    
    // Шаг 2: Миграция существующих данных
    console.log('\n📋 Шаг 2: Миграция существующих данных...');
    const dataResult = await migrateExistingData();
    if (!dataResult) {
      console.error('❌ Миграция прервана на этапе миграции данных');
      return;
    }
    
    // Шаг 3: Тестирование новой системы
    console.log('\n🧪 Шаг 3: Тестирование новой системы...');
    const testResult = await testNewSystem();
    if (!testResult) {
      console.error('❌ Миграция прервана на этапе тестирования');
      return;
    }
    
    console.log('\n🎉 Миграция успешно завершена!');
    console.log('\n📋 Что изменилось:');
    console.log('• Новая система подписок с тегами');
    console.log('• Персонализированные уведомления');
    console.log('• Автоматическое сопоставление предпочтений');
    console.log('• Улучшенная синхронизация с Google Sheets');
    
    console.log('\n🚀 Следующие шаги:');
    console.log('1. Обновите команды в боте на новые');
    console.log('2. Протестируйте систему опросов');
    console.log('3. Проверьте работу уведомлений');
    console.log('4. Настройте теги в Google Sheets');
    
  } catch (error) {
    console.error('❌ Критическая ошибка миграции:', error);
  }
}

main();
