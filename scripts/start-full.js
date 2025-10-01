#!/usr/bin/env node

/**
 * Полный запуск: Telegram бот + Webhook сервер
 * Запускает всю систему одновременно
 */

import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { google } from 'googleapis';
import { createDriveService } from '../src/services/googleDrive.js';
import { createSheetsService } from '../src/services/googleSheets.js';
import { handleDocument } from '../src/handlers/document.js';
import { handleText } from '../src/handlers/text.js';
import { CommandManager } from '../src/commands/CommandManager.js';
import { ActionManager } from '../src/actions/ActionManager.js';
import { syncScheduler } from '../src/services/scheduler.js';
import { webhookService } from '../src/services/webhook.js';
import { telegramNotifications } from '../src/services/telegram-notifications.js';

console.log('\n🚀 ПОЛНЫЙ ЗАПУСК СИСТЕМЫ\n');
console.log('=' .repeat(60));

// Проверка конфигурации
console.log('\n🔍 Проверка конфигурации...\n');

const requiredEnv = {
    'TELEGRAM_BOT_TOKEN': 'Токен Telegram бота',
    'SUPABASE_URL': 'URL Supabase',
    'SUPABASE_ANON_KEY': 'Ключ Supabase'
};

let hasErrors = false;

for (const [key, description] of Object.entries(requiredEnv)) {
    if (!process.env[key]) {
        console.error(`❌ ${key} не найден! (${description})`);
        hasErrors = true;
    } else {
        console.log(`✅ ${key}: установлен`);
    }
}

if (hasErrors) {
    console.error('\n❌ Исправьте ошибки в .env файле');
    console.error('💡 Запустите: npm run check-env\n');
    process.exit(1);
}

console.log('\n' + '='.repeat(60));

// Инициализация бота
console.log('\n📱 Инициализация Telegram бота...\n');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.use((ctx, next) => {
    if (!ctx.session) {
        ctx.session = {};
    }
    return next();
});

// Google Services (если нужны)
let auth, driveService, sheetsService;
if (process.env.GOOGLE_SERVICE_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    auth = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets']
    );
    driveService = createDriveService(auth);
    sheetsService = createSheetsService(auth);
    console.log('✅ Google Services инициализированы');
} else {
    console.log('⚠️  Google Services не настроены (опционально)');
}

// Регистрация команд и действий
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

console.log('✅ Telegram бот настроен');

// Запуск сервисов
console.log('\n🔧 Запуск сервисов...\n');

async function startAll() {
    try {
        // 1. Запускаем webhook сервер
        console.log('1️⃣  Запуск Webhook сервера...');
        await webhookService.start();
        
        // 2. Запускаем уведомления
        console.log('2️⃣  Инициализация уведомлений...');
        telegramNotifications.initialize();
        
        // 3. Запускаем синхронизацию
        console.log('3️⃣  Запуск планировщика синхронизации...');
        syncScheduler.start();
        
        // 4. Запускаем бота
        console.log('4️⃣  Запуск Telegram бота...');
        await bot.launch();
        
        // Уведомление о старте
        telegramNotifications.notifyBotStart();
        
        console.log('\n' + '='.repeat(60));
        console.log('\n✅ ВСЯ СИСТЕМА ЗАПУЩЕНА!\n');
        console.log('📋 Доступные сервисы:');
        console.log(`   • Telegram бот: @${bot.botInfo?.username || 'бот'}`);
        console.log(`   • WebApp форма: http://localhost:${process.env.WEBHOOK_PORT || 3001}/webapp/`);
        console.log(`   • API Health: http://localhost:${process.env.WEBHOOK_PORT || 3001}/health`);
        console.log('\n💡 Для остановки нажмите Ctrl+C\n');
        console.log('='.repeat(60) + '\n');
        
    } catch (error) {
        console.error('\n❌ Ошибка запуска системы:', error);
        process.exit(1);
    }
}

// Graceful shutdown
async function shutdown() {
    console.log('\n⏹️  Остановка системы...\n');
    
    try {
        console.log('1️⃣  Остановка планировщика...');
        syncScheduler.stop();
        
        console.log('2️⃣  Остановка webhook сервера...');
        await webhookService.stop();
        
        console.log('3️⃣  Остановка Telegram бота...');
        bot.stop('SIGINT');
        
        console.log('\n✅ Система остановлена\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка при остановке:', error);
        process.exit(1);
    }
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

// Запуск
startAll();

