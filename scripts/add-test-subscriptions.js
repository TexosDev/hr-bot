import 'dotenv/config';
import { google } from 'googleapis';
import { createSubscriptionsService, addSubscriptionToSheet } from './src/services/subscriptions.js';

// Инициализация Google API
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets']
);

const subscriptionsService = createSubscriptionsService(auth);
const RESPONSES_SHEET_ID = process.env.GOOGLE_RESPONSES_SHEET_ID || process.env.GOOGLE_SHEET_ID;

async function addTestSubscriptions() {
  try {
    console.log('🧪 Добавление тестовых подписок...');
    
    // Тестовые подписки
    const testSubscriptions = [
      { userId: '123456789', username: 'test_user_1', category: 'IT/Разработка' },
      { userId: '987654321', username: 'test_user_2', category: 'IT/Разработка' },
      { userId: '123456789', username: 'test_user_1', category: 'Маркетинг' },
      { userId: '555666777', username: 'test_user_3', category: 'Маркетинг' }
    ];
    
    for (const subscription of testSubscriptions) {
      console.log(`📝 Добавляем подписку: ${subscription.username} -> ${subscription.category}`);
      
      const success = await addSubscriptionToSheet(subscriptionsService, RESPONSES_SHEET_ID, subscription);
      
      if (success) {
        console.log(`✅ Подписка добавлена: ${subscription.username} -> ${subscription.category}`);
      } else {
        console.log(`❌ Ошибка добавления подписки: ${subscription.username} -> ${subscription.category}`);
      }
      
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✅ Тестовые подписки добавлены');
    
  } catch (error) {
    console.error('❌ Ошибка добавления тестовых подписок:', error);
  }
}

// Запуск
addTestSubscriptions();
