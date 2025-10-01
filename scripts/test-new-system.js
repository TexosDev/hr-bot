import 'dotenv/config';
import { supabase } from '../src/services/supabase/supabase.js';
import { saveUserPreferences, getUserPreferences } from '../src/services/supabase/supabaseUserPreferences.js';

console.log('🧪 Тестирование новой системы подписок...');

async function testNewSystem() {
  try {
    // 1. Тестируем сохранение предпочтений пользователя
    console.log('\n1️⃣ Тестирование сохранения предпочтений...');
    
    const testUser = {
      id: 123456789,
      username: 'test_user',
      first_name: 'Test User'
    };
    
    const testPreferences = {
      directions: ['IT', 'Design'],
      technologies: ['React', 'Vue.js', 'JavaScript'],
      experience: ['Middle'],
      salary: '100,000 - 150,000',
      work_conditions: ['Удаленка', 'Гибрид'],
      location: 'Рассмотрю варианты',
      company_size: ['Средняя компания']
    };
    
    const result = await saveUserPreferences(testUser.id, testUser, testPreferences);
    
    if (result) {
      console.log('✅ Предпочтения сохранены успешно');
    } else {
      console.log('❌ Ошибка сохранения предпочтений');
      return;
    }
    
    // 2. Тестируем получение предпочтений
    console.log('\n2️⃣ Тестирование получения предпочтений...');
    
    const savedPreferences = await getUserPreferences(testUser.id);
    
    if (savedPreferences) {
      console.log('✅ Предпочтения получены успешно');
      console.log('📋 Направления:', savedPreferences.preferences.directions);
      console.log('💻 Технологии:', savedPreferences.preferences.technologies);
    } else {
      console.log('❌ Ошибка получения предпочтений');
      return;
    }
    
    // 3. Тестируем получение всех подписчиков
    console.log('\n3️⃣ Тестирование получения подписчиков...');
    
    const { data: subscribers, error: subscribersError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('is_active', true);
    
    if (subscribersError) {
      console.log('❌ Ошибка получения подписчиков:', subscribersError.message);
    } else {
      console.log(`✅ Найдено ${subscribers.length} активных подписчиков`);
    }
    
    // 4. Тестируем получение тегов
    console.log('\n4️⃣ Тестирование получения тегов...');
    
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('is_active', true);
    
    if (tagsError) {
      console.log('❌ Ошибка получения тегов:', tagsError.message);
    } else {
      console.log(`✅ Найдено ${tags.length} активных тегов`);
      console.log('📋 Примеры тегов:', tags.slice(0, 5).map(t => t.name).join(', '));
    }
    
    // 5. Тестируем обновление вакансий с тегами
    console.log('\n5️⃣ Тестирование обновления вакансий с тегами...');
    
    const { data: vacancies, error: vacanciesError } = await supabase
      .from('vacancies')
      .select('*')
      .limit(1);
    
    if (vacanciesError) {
      console.log('❌ Ошибка получения вакансий:', vacanciesError.message);
    } else if (vacancies.length > 0) {
      const vacancy = vacancies[0];
      console.log('✅ Вакансия найдена:', vacancy.title);
      
      // Проверяем, есть ли поле tags
      if (vacancy.tags) {
        console.log('📋 Теги вакансии:', vacancy.tags);
      } else {
        console.log('⚠️ У вакансии нет тегов');
      }
    }
    
    console.log('\n🎉 Тестирование завершено!');
    console.log('\n📋 Следующие шаги:');
    console.log('1. Создайте недостающие таблицы в Supabase Dashboard');
    console.log('2. Обновите команды бота на новые');
    console.log('3. Протестируйте систему опросов');
    console.log('4. Добавьте теги в Google Sheets');
    
  } catch (error) {
    console.error('❌ Критическая ошибка тестирования:', error);
  }
}

testNewSystem();
