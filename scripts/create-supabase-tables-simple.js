import 'dotenv/config';
import { supabase } from './src/services/supabase.js';

console.log('🔧 Создание таблиц в Supabase...');

async function createVacanciesTable() {
  try {
    console.log('📝 Создание таблицы vacancies...');
    
    // Проверяем, существует ли таблица
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'vacancies');
    
    if (tablesError) {
      console.log('⚠️ Не удалось проверить существование таблицы');
      return false;
    }
    
    if (tables && tables.length > 0) {
      console.log('✅ Таблица vacancies уже существует');
      return true;
    }
    
    // Создаем таблицу через SQL Editor (нужно сделать вручную)
    console.log('❌ Таблица vacancies не найдена');
    console.log('💡 Нужно создать таблицы вручную через SQL Editor в Supabase');
    return false;
    
  } catch (error) {
    console.error('❌ Ошибка создания таблицы vacancies:', error);
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
    
    // 1. Проверяем таблицы
    const tablesExist = await createVacanciesTable();
    if (!tablesExist) {
      console.log('\n💡 Инструкция по созданию таблиц:');
      console.log('1. Откройте панель Supabase');
      console.log('2. Перейдите в SQL Editor');
      console.log('3. Скопируйте содержимое файла supabase-schema.sql');
      console.log('4. Вставьте и выполните SQL');
      console.log('5. Запустите этот скрипт снова');
      return;
    }
    
    // 2. Добавляем тестовые данные
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
