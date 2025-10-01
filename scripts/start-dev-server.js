#!/usr/bin/env node

/**
 * Сервер разработки для бота и WebApp
 * Запускает основной бот-сервер с поддержкой WebApp
 */

import { WebhookService } from '../src/services/webhook.js';

console.log('🚀 Запуск сервера разработки бота...\n');

const webhookService = new WebhookService();

webhookService.start()
    .then(() => {
        console.log('\n✅ Сервер успешно запущен!');
        console.log('\n📋 Следующие шаги:');
        console.log('   1. Откройте: http://localhost:3001/webapp/');
        console.log('   2. Заполните форму');
        console.log('   3. Проверьте данные в Supabase\n');
        console.log('💡 Для остановки нажмите Ctrl+C\n');
    })
    .catch(error => {
        console.error('\n❌ Ошибка запуска сервера:', error.message);
        
        if (error.code === 'EADDRINUSE') {
            console.error('\n💡 Решения:');
            console.error('   1. Остановите процесс на порту 3001');
            console.error('   2. Или измените порт в .env: WEBHOOK_PORT=3002\n');
        } else {
            console.error('\n💡 Проверьте:');
            console.error('   1. Файл .env существует и заполнен');
            console.error('   2. Переменные SUPABASE_URL и SUPABASE_ANON_KEY установлены');
            console.error('   3. Запустите: npm run check-env\n');
        }
        
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️ Остановка сервера разработки...');
    await webhookService.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⏹️ Остановка сервера разработки...');
    await webhookService.stop();
    process.exit(0);
});
