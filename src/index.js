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
import { webhookService } from './services/webhook.js';
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
console.log('🔧 Инициализация сервисов...');
telegramNotifications.initialize();
syncScheduler.start();
if (process.env.ENABLE_WEBHOOK === 'true') {
  webhookService.start();
}
console.log('🚀 Бот запущен!');
bot.launch();
telegramNotifications.notifyBotStart();
process.once('SIGINT', () => {
  console.log('⏹️ Остановка сервисов...');
  syncScheduler.stop();
  webhookService.stop();
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('⏹️ Остановка сервисов...');
  syncScheduler.stop();
  webhookService.stop();
  bot.stop('SIGTERM');
});
