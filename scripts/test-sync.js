import 'dotenv/config';
import { syncScheduler } from '../src/services/scheduler.js';
import { webhookService } from '../src/services/webhook.js';
import { telegramNotifications } from '../src/services/telegram-notifications.js';

/**
 * Скрипт для тестирования синхронизации
 * Следует принципам SOLID, DRY, KISS
 */

console.log('🧪 Тестирование системы синхронизации...');

async function testSync() {
  try {
    // Инициализация уведомлений
    telegramNotifications.initialize();
    
    console.log('📤 Отправка тестового уведомления...');
    await telegramNotifications.sendTestNotification();
    
    console.log('🔄 Тестирование ручной синхронизации...');
    await syncScheduler.manualSync();
    
    console.log('🌐 Тестирование webhook сервера...');
    webhookService.start();
    
    // Тестовый запрос к webhook
    setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:${process.env.WEBHOOK_PORT || 3001}/test`);
        const data = await response.json();
        console.log('✅ Webhook тест:', data);
      } catch (error) {
        console.error('❌ Ошибка webhook теста:', error);
      }
    }, 2000);
    
    console.log('✅ Все тесты завершены!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

testSync();
