import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { google } from 'googleapis';
import { createDriveService } from './services/googleDrive.js';
import { createSheetsService } from './services/googleSheets.js';
import { handleDocument } from './handlers/document.js';
import { handleText } from './handlers/text.js';
import { CONFIG } from './config/constants.js';
import { CommandManager } from './commands/CommandManager.js';
import { ActionManager } from './actions/ActionManager.js';
import { syncScheduler } from './services/scheduler.js';
import { telegramNotifications } from './services/telegram-notifications.js';

console.log('🔍 Проверка конфигурации...');
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не найден!');
  process.exit(1);
}
if (!process.env.ADMIN_CHAT_ID) {
  console.error('❌ ADMIN_CHAT_ID не найден!');
  process.exit(1);
}
console.log('✅ Основные переменные настроены');
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use((ctx, next) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  return next();
});
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets']
);

const driveService = createDriveService(auth);
const sheetsService = createSheetsService(auth);
const commandManager = new CommandManager();
const actionManager = new ActionManager();
commandManager.registerAll(bot);
actionManager.registerAll(bot);
bot.on('document', handleDocument);
bot.on('text', handleText);
bot.catch((err, ctx) => {
  console.error('❌ Ошибка бота:', err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
});
// Функция запуска бота
async function startBot() {
  console.log('🔧 Инициализация сервисов...');
  telegramNotifications.initialize();
  syncScheduler.start();

  // ЧИСТАЯ АРХИТЕКТУРА: только Telegram бот
  // HTTP сервер для WebApp теперь отдельный сервис (scripts/start-webapp-production.js)
  
  console.log('📱 Запуск Telegram бота (polling режим)...');
  
  // Обрабатываем ошибку 409 (временные конфликты при деплое)
  try {
    await bot.launch();
    console.log('✅ Telegram бот запущен');
  } catch (error) {
    if (error.response?.error_code === 409) {
      console.warn('⚠️ Ошибка 409: другой экземпляр бота уже запущен');
      console.warn('💡 Это нормально при перезапусках Railway, ждём...');
      // Ждём 5 секунд и пробуем снова
      await new Promise(resolve => setTimeout(resolve, 5000));
      await bot.launch();
      console.log('✅ Telegram бот запущен (второй попытка)');
    } else {
      throw error;
    }
  }

  console.log('🚀 Бот запущен и готов к работе!');
  telegramNotifications.notifyBotStart();
}

// Запуск
startBot().catch(err => {
  console.error('❌ Критическая ошибка запуска:', err);
  process.exit(1);
});
process.once('SIGINT', () => {
  console.log('⏹️ Остановка бота...');
  syncScheduler.stop();
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('⏹️ Остановка бота...');
  syncScheduler.stop();
  bot.stop('SIGTERM');
});
