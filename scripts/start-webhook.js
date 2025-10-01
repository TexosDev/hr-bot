import 'dotenv/config';
import { webhookService } from '../src/services/webhook.js';
import { telegramNotifications } from '../src/services/telegram-notifications.js';

/**
 * Скрипт для запуска webhook сервера
 * Следует принципам SOLID, DRY, KISS
 */

console.log('🚀 Запуск webhook сервера...');

// Инициализация уведомлений
telegramNotifications.initialize();

// Запуск webhook сервера
webhookService.start();

// Уведомление о запуске
telegramNotifications.notifyAdmin(
  `🚀 *Webhook сервер запущен*\n\n` +
  `Время: ${new Date().toLocaleString('ru-RU')}\n` +
  `Порт: ${process.env.WEBHOOK_PORT || 3001}\n` +
  `Статус: Готов к получению webhook'ов`,
  { parse_mode: 'Markdown' }
);

// Обработка сигналов для graceful shutdown
process.once('SIGINT', () => {
  console.log('\n⏹️ Остановка webhook сервера...');
  webhookService.stop();
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\n⏹️ Остановка webhook сервера...');
  webhookService.stop();
  process.exit(0);
});
