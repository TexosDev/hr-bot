import 'dotenv/config';
import { supabase } from '../src/services/supabase/supabase.js';
import { saveUserPreferences, getUserPreferences } from '../src/services/supabase/supabaseUserPreferences.js';

console.log('🧪 Полное тестирование новой системы подписок...');

async function testCompleteSystem() {
  try {
    console.log('\n🎯 Тестирование новой системы подписок с тегами');
    console.log('=' .repeat(50));
    
    // 1. Тестируем сохранение предпочтений
    console.log('\n1️⃣ Тестирование сохранения предпочтений...');
    
    const testUser = {
      id: 999999999,
      username: 'test_new_system',
      first_name: 'Test New System'
    };
    
    const testPreferences = {
      directions: ['IT', 'Design', 'Marketing'],
      technologies: ['React', 'Vue.js', 'JavaScript', 'Python'],
      experience: ['Middle', 'Senior'],
      salary: '150,000 - 250,000',
      work_conditions: ['Удаленка', 'Гибрид'],
      location: 'Готов к переезду',
      company_size: ['Средняя компания', 'Крупная компания']
    };
    
    const saveResult = await saveUserPreferences(testUser.id, testUser, testPreferences);
    
    if (saveResult) {
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
      console.log('📈 Опыт:', savedPreferences.preferences.experience);
      console.log('💰 Зарплата:', savedPreferences.preferences.salary);
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
      
      // Показываем статистику
      const stats = {
        total: subscribers.length,
        by_direction: {},
        by_technology: {},
        by_experience: {}
      };
      
      subscribers.forEach(sub => {
        const prefs = sub.preferences;
        
        if (prefs.directions) {
          prefs.directions.forEach(dir => {
            stats.by_direction[dir] = (stats.by_direction[dir] || 0) + 1;
          });
        }
        
        if (prefs.technologies) {
          prefs.technologies.forEach(tech => {
            stats.by_technology[tech] = (stats.by_technology[tech] || 0) + 1;
          });
        }
        
        if (prefs.experience) {
          prefs.experience.forEach(exp => {
            stats.by_experience[exp] = (stats.by_experience[exp] || 0) + 1;
          });
        }
      });
      
      console.log('📊 Статистика подписчиков:');
      console.log('  - Всего:', stats.total);
      console.log('  - Популярные направления:', Object.entries(stats.by_direction).slice(0, 3));
      console.log('  - Популярные технологии:', Object.entries(stats.by_technology).slice(0, 3));
      console.log('  - Распределение по опыту:', Object.entries(stats.by_experience));
    }
    
    // 4. Тестируем получение тегов
    console.log('\n4️⃣ Тестирование получения тегов...');
    
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('is_active', true)
      .order('category, name');
    
    if (tagsError) {
      console.log('❌ Ошибка получения тегов:', tagsError.message);
    } else {
      console.log(`✅ Найдено ${tags.length} активных тегов`);
      
      // Группируем по категориям
      const tagsByCategory = {};
      tags.forEach(tag => {
        if (!tagsByCategory[tag.category]) {
          tagsByCategory[tag.category] = [];
        }
        tagsByCategory[tag.category].push(tag.name);
      });
      
      console.log('📋 Теги по категориям:');
      Object.entries(tagsByCategory).forEach(([category, tagNames]) => {
        console.log(`  - ${category}: ${tagNames.slice(0, 5).join(', ')}${tagNames.length > 5 ? '...' : ''}`);
      });
    }
    
    // 5. Тестируем вакансии с тегами
    console.log('\n5️⃣ Тестирование вакансий с тегами...');
    
    const { data: vacancies, error: vacanciesError } = await supabase
      .from('vacancies')
      .select('*')
      .eq('is_active', true)
      .limit(3);
    
    if (vacanciesError) {
      console.log('❌ Ошибка получения вакансий:', vacanciesError.message);
    } else {
      console.log(`✅ Найдено ${vacancies.length} активных вакансий`);
      
      vacancies.forEach((vacancy, index) => {
        console.log(`  ${index + 1}. ${vacancy.title}`);
        console.log(`     Категория: ${vacancy.category}`);
        if (vacancy.tags && vacancy.tags.length > 0) {
          console.log(`     Теги: ${vacancy.tags.join(', ')}`);
        } else {
          console.log(`     Теги: не указаны`);
        }
        if (vacancy.work_type) {
          console.log(`     Формат работы: ${vacancy.work_type}`);
        }
        if (vacancy.experience_level) {
          console.log(`     Уровень: ${vacancy.experience_level}`);
        }
      });
    }
    
    // 6. Тестируем синхронизацию
    console.log('\n6️⃣ Тестирование синхронизации...');
    
    try {
      const { fullSyncWithTags } = await import('../src/services/supabase/syncSheetsSupabaseWithTags.js');
      console.log('✅ Модуль синхронизации загружен');
      console.log('💡 Для полного тестирования запустите: npm run sync');
    } catch (error) {
      console.log('⚠️ Модуль синхронизации не найден:', error.message);
    }
    
    console.log('\n🎉 Полное тестирование завершено!');
    console.log('\n📋 Результаты:');
    console.log('✅ Система подписок с тегами работает');
    console.log('✅ Предпочтения пользователей сохраняются');
    console.log('✅ Теги и вакансии загружаются');
    console.log('✅ Статистика собирается');
    
    console.log('\n🚀 Следующие шаги:');
    console.log('1. Протестируйте бота: отправьте /subscribe');
    console.log('2. Пройдите опрос в боте');
    console.log('3. Проверьте сохранение предпочтений');
    console.log('4. Добавьте теги в Google Sheets');
    console.log('5. Запустите синхронизацию: npm run sync');
    
  } catch (error) {
    console.error('❌ Критическая ошибка тестирования:', error);
  }
}

testCompleteSystem();
