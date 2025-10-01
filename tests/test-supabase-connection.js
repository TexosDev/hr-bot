import 'dotenv/config';
import { supabase, testSupabaseConnection } from '../src/services/supabase/supabase.js';
import { getVacanciesFromSupabase } from '../src/services/supabase/supabaseVacancies.js';
import { getSubscriptionsFromSupabase } from '../src/services/supabase/supabaseSubscriptions.js';

console.log('🔍 Тестирование подключения к Supabase...');

async function testSupabase() {
  try {
    // 1. Проверка подключения
    console.log('\n1. Проверка подключения...');
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.log('❌ Не удалось подключиться к Supabase');
      return;
    }
    
    // 2. Тестирование получения вакансий
    console.log('\n2. Тестирование получения вакансий...');
    const vacancies = await getVacanciesFromSupabase();
    console.log(`📋 Найдено вакансий: ${vacancies.length}`);
    
    if (vacancies.length > 0) {
      console.log('📋 Первая вакансия:', vacancies[0].title);
    }
    
    // 3. Тестирование получения подписок
    console.log('\n3. Тестирование получения подписок...');
    const subscriptions = await getSubscriptionsFromSupabase();
    console.log(`📋 Найдено подписок: ${subscriptions.length}`);
    
    // 4. Тестирование добавления тестовой подписки
    console.log('\n4. Тестирование добавления подписки...');
    const testSubscription = {
      user_id: 123456789,
      username: 'test_user',
      category: 'IT/Разработка'
    };
    
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert([testSubscription])
      .select()
      .single();
    
    if (subscriptionError) {
      console.log('❌ Ошибка добавления подписки:', subscriptionError.message);
    } else {
      console.log('✅ Тестовая подписка добавлена:', subscriptionData.id);
      
      // Удаляем тестовую подписку
      await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionData.id);
      console.log('🗑️ Тестовая подписка удалена');
    }
    
    // 5. Тестирование статистики
    console.log('\n5. Тестирование статистики...');
    const { data: stats, error: statsError } = await supabase
      .from('stats_dashboard')
      .select('*')
      .single();
    
    if (statsError) {
      console.log('❌ Ошибка получения статистики:', statsError.message);
    } else {
      console.log('📊 Статистика:', stats);
    }
    
    console.log('\n✅ Все тесты Supabase прошли успешно!');
    console.log('🚀 Supabase готов к использованию');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования Supabase:', error);
  }
}

testSupabase();
