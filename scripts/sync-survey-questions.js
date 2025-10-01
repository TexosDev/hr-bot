#!/usr/bin/env node

/**
 * Скрипт синхронизации вопросов опроса из Google Sheets в Supabase
 * Запуск: npm run sync-questions
 */

import { syncSurveyQuestions } from '../src/services/supabase/syncSurveyQuestions.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n' + '='.repeat(60));
console.log('🔄 СИНХРОНИЗАЦИЯ ВОПРОСОВ ОПРОСА');
console.log('='.repeat(60) + '\n');

// Проверка конфигурации
console.log('🔍 Проверка конфигурации...\n');

const required = [
    'GOOGLE_QUESTIONS_SHEET_ID',
    'GOOGLE_SERVICE_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
];

let hasErrors = false;

for (const key of required) {
    if (!process.env[key]) {
        console.error(`❌ ${key} не найден в .env`);
        hasErrors = true;
    } else {
        console.log(`✅ ${key}: настроен`);
    }
}

if (hasErrors) {
    console.error('\n❌ Исправьте ошибки в .env файле');
    console.error('\n💡 Добавьте в .env:');
    console.error('   GOOGLE_QUESTIONS_SHEET_ID=ваш_id_таблицы');
    console.error('   GOOGLE_SERVICE_EMAIL=email_сервисного_аккаунта');
    console.error('   GOOGLE_PRIVATE_KEY=приватный_ключ\n');
    process.exit(1);
}

console.log('\n' + '='.repeat(60) + '\n');

// Запуск синхронизации
syncSurveyQuestions()
    .then(result => {
        console.log('\n' + '='.repeat(60));
        
        if (result.success) {
            console.log('✅ СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА УСПЕШНО!');
            console.log('='.repeat(60));
            console.log(`\n📊 Статистика:`);
            console.log(`   • Категорий: ${result.categories.synced}`);
            console.log(`   • Полей: ${result.fields.synced}\n`);
            
            console.log('💡 Следующие шаги:');
            console.log('   1. Проверьте данные в Supabase Table Editor');
            console.log('   2. Откройте WebApp: http://localhost:3001/webapp/');
            console.log('   3. Проверьте что вопросы загружаются из БД\n');
        } else {
            console.error('❌ ОШИБКА СИНХРОНИЗАЦИИ');
            console.error('='.repeat(60));
            console.error(`\nОшибка: ${result.error}\n`);
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n❌ Критическая ошибка:', error);
        process.exit(1);
    });

