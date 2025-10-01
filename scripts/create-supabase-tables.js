import 'dotenv/config';
import { supabase } from './src/services/supabase.js';

console.log('🔧 Создание таблиц в Supabase...');

async function createTables() {
  try {
    // SQL для создания таблиц
    const createTablesSQL = `
-- Создание таблицы вакансий
CREATE TABLE IF NOT EXISTS vacancies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    category VARCHAR(100) NOT NULL,
    link VARCHAR(500),
    level VARCHAR(50),
    salary VARCHAR(100),
    requirements TEXT,
    benefits TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы откликов
CREATE TABLE IF NOT EXISTS responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    file_name VARCHAR(255),
    file_mime VARCHAR(100),
    telegram_link VARCHAR(500),
    status VARCHAR(50) DEFAULT 'new',
    vacancy_id UUID REFERENCES vacancies(id),
    vacancy_title VARCHAR(255),
    text_preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы подписок
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL,
    username VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

    console.log('📝 Выполнение SQL для создания таблиц...');
    
    // Выполняем SQL через Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    
    if (error) {
      console.error('❌ Ошибка создания таблиц:', error);
      return false;
    }
    
    console.log('✅ Таблицы созданы успешно');
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
    return false;
  }
}

async function createIndexes() {
  try {
    console.log('📝 Создание индексов...');
    
    const createIndexesSQL = `
-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_vacancies_category ON vacancies(category);
CREATE INDEX IF NOT EXISTS idx_vacancies_active ON vacancies(is_active);
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_vacancy_id ON responses(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);
`;

    const { data, error } = await supabase.rpc('exec_sql', { sql: createIndexesSQL });
    
    if (error) {
      console.error('❌ Ошибка создания индексов:', error);
      return false;
    }
    
    console.log('✅ Индексы созданы успешно');
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка создания индексов:', error);
    return false;
  }
}

async function insertTestData() {
  try {
    console.log('📝 Добавление тестовых данных...');
    
    // Добавляем тестовые вакансии
    const testVacancies = [
      {
        title: 'Frontend Developer',
        description: 'Разработка пользовательских интерфейсов',
        emoji: '💻',
        category: 'IT/Разработка',
        level: 'Middle',
        salary: '150-200k',
        requirements: 'React, Vue, JavaScript',
        benefits: 'Удаленка, гибкий график'
      },
      {
        title: 'Backend Developer',
        description: 'Разработка серверной части',
        emoji: '⚙️',
        category: 'IT/Разработка',
        level: 'Senior',
        salary: '200-300k',
        requirements: 'Node.js, Python, PostgreSQL',
        benefits: 'Спортзал, медстраховка'
      },
      {
        title: 'UI/UX Designer',
        description: 'Создание дизайна интерфейсов',
        emoji: '🎨',
        category: 'Дизайн',
        level: 'Middle',
        salary: '120-180k',
        requirements: 'Figma, Adobe XD, Sketch',
        benefits: 'Креативная команда'
      }
    ];
    
    const { data, error } = await supabase
      .from('vacancies')
      .insert(testVacancies)
      .select();
    
    if (error) {
      console.error('❌ Ошибка добавления тестовых данных:', error);
      return false;
    }
    
    console.log(`✅ Добавлено ${data.length} тестовых вакансий`);
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка добавления тестовых данных:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Настройка Supabase...');
    
    // 1. Создаем таблицы
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      console.log('❌ Не удалось создать таблицы');
      return;
    }
    
    // 2. Создаем индексы
    const indexesCreated = await createIndexes();
    if (!indexesCreated) {
      console.log('❌ Не удалось создать индексы');
      return;
    }
    
    // 3. Добавляем тестовые данные
    const testDataAdded = await insertTestData();
    if (!testDataAdded) {
      console.log('❌ Не удалось добавить тестовые данные');
      return;
    }
    
    console.log('\n🎉 Supabase настроен успешно!');
    console.log('📋 Теперь можно тестировать подключение');
    
  } catch (error) {
    console.error('❌ Ошибка настройки Supabase:', error);
  }
}

main();
