import 'dotenv/config';

// Проверяем режим запуска через переменную окружения
const SERVICE_MODE = process.env.SERVICE_MODE || 'bot';

console.log(`🚀 Режим запуска: ${SERVICE_MODE.toUpperCase()}`);

// WEBAPP MODE - только веб-сервер для формы подписки
if (SERVICE_MODE === 'webapp') {
  console.log('🌐 Запуск WebApp сервера...');
  
  const { webhookService } = await import('./services/webhook.js');
  
  await webhookService.start();
  console.log('✅ WebApp сервер запущен и готов к работе!');
  console.log(`📱 WebApp доступен по Public URL Railway`);
  console.log(`❤️  Health check: /health`);
  
  process.on('SIGINT', () => {
    console.log('\n⏹️ Остановка WebApp сервера...');
    webhookService.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n⏹️ Остановка WebApp сервера...');
    webhookService.stop();
    process.exit(0);
  });
  
} else {
  // BOT MODE - Telegram бот + фоновые задачи
  console.log('🤖 Запуск Telegram бота...');
  
  const { Telegraf } = await import('telegraf');
  const { google } = await import('googleapis');
  const { createDriveService } = await import('./services/googleDrive.js');
  const { createSheetsService } = await import('./services/googleSheets.js');
  const { handleDocument } = await import('./handlers/document.js');
  const { handleText } = await import('./handlers/text.js');
  const { CONFIG } = await import('./config/constants.js');
  const { CommandManager } = await import('./commands/CommandManager.js');
  const { ActionManager } = await import('./actions/ActionManager.js');
  const { syncScheduler } = await import('./services/scheduler.js');
  const { telegramNotifications } = await import('./services/telegram-notifications.js');

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
  
  // Google Sheets и Drive настройки
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  
  commandManager.registerAll(bot);
  actionManager.registerAll(bot);
  
  // Регистрируем обработчик документов с параметрами
  bot.on('document', (ctx) => handleDocument(ctx, driveService, sheetsService, sheetId, folderId));
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

    console.log('📱 Запуск Telegram бота (polling режим)...');
    
    // Обрабатываем ошибку 409 (временные конфликты при деплое Railway)
    try {
      await bot.launch();
      console.log('✅ Telegram бот запущен');
    } catch (error) {
      if (error.response?.error_code === 409) {
        console.warn('⚠️ Ошибка 409: другой экземпляр бота уже запущен');
        console.warn('💡 Это нормально при перезапусках Railway, ждём 5 секунд...');
        // Ждём 5 секунд и пробуем снова
        await new Promise(resolve => setTimeout(resolve, 5000));
        await bot.launch();
        console.log('✅ Telegram бот запущен (вторая попытка)');
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
}
