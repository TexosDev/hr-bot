import 'dotenv/config';
import { supabase } from '../src/services/supabase/supabase.js';

console.log('📊 Создание недостающих таблиц...');

async function createMissingTables() {
  try {
    // 1. Создаем таблицу user_preferences
    console.log('🔄 Создание таблицы user_preferences...');
    
    const { error: userPrefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(1);
    
    if (userPrefsError && userPrefsError.message.includes('Could not find the table')) {
      console.log('📋 Таблица user_preferences не найдена, создаем...');
      
      // Создаем таблицу через простой запрос
      const { error: createError } = await supabase
        .rpc('create_user_preferences_table');
      
      if (createError) {
        console.log('⚠️ Не удалось создать через RPC, попробуем другой способ');
      }
    } else {
      console.log('✅ Таблица user_preferences уже существует');
    }
    
    // 2. Создаем таблицу notifications
    console.log('🔄 Создание таблицы notifications...');
    
    const { error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (notificationsError && notificationsError.message.includes('Could not find the table')) {
      console.log('📋 Таблица notifications не найдена, создаем...');
      
      // Создаем таблицу через простой запрос
      const { error: createError } = await supabase
        .rpc('create_notifications_table');
      
      if (createError) {
        console.log('⚠️ Не удалось создать через RPC, попробуем другой способ');
      }
    } else {
      console.log('✅ Таблица notifications уже существует');
    }
    
    console.log('\n📋 Инструкции по созданию таблиц:');
    console.log('1. Откройте Supabase Dashboard');
    console.log('2. Перейдите в SQL Editor');
    console.log('3. Выполните следующие SQL запросы:');
    console.log('');
    console.log('-- Создание таблицы user_preferences');
    console.log('CREATE TABLE IF NOT EXISTS user_preferences (');
    console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('    user_id BIGINT NOT NULL UNIQUE,');
    console.log('    username VARCHAR(100),');
    console.log('    first_name VARCHAR(100),');
    console.log('    preferences JSONB NOT NULL DEFAULT \'{}\',');
    console.log('    is_active BOOLEAN DEFAULT true,');
    console.log('    subscription_type VARCHAR(50) DEFAULT \'survey_based\',');
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('-- Создание таблицы notifications');
    console.log('CREATE TABLE IF NOT EXISTS notifications (');
    console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('    user_id BIGINT NOT NULL,');
    console.log('    vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,');
    console.log('    status VARCHAR(20) DEFAULT \'sent\',');
    console.log('    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    delivered_at TIMESTAMP WITH TIME ZONE,');
    console.log('    error_message TEXT');
    console.log(');');
    console.log('');
    console.log('-- Создание индексов');
    console.log('CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_user_preferences_active ON user_preferences(is_active);');
    console.log('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_notifications_vacancy ON notifications(vacancy_id);');
    
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
  }
}

createMissingTables();
