/**
 * Скрипт для проверки наличия и корректности .env файла
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function success(message) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function error(message) {
    console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function warning(message) {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function info(message) {
    console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

console.log('\n🔍 Проверка .env файла...\n');

// Проверяем существование файла
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

if (!fs.existsSync(envPath)) {
    error('.env файл не найден!');
    console.log(`\n📍 Ожидаемый путь: ${envPath}\n`);
    
    if (fs.existsSync(envExamplePath)) {
        info('Найден файл .env.example');
        console.log('\n💡 Создайте .env файл:');
        console.log('   1. Скопируйте .env.example в .env');
        console.log('   2. Заполните значения переменных\n');
    } else {
        console.log('\n💡 Создайте .env файл в корне проекта:');
        console.log(`
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
WEBHOOK_PORT=3001
NODE_ENV=development
        `);
    }
    process.exit(1);
}

success('.env файл найден');
console.log(`📍 Путь: ${envPath}\n`);

// Загружаем переменные
const result = dotenv.config({ path: envPath });

if (result.error) {
    error(`Ошибка загрузки .env: ${result.error.message}`);
    process.exit(1);
}

// Проверяем обязательные переменные
const requiredVars = {
    'SUPABASE_URL': {
        required: true,
        example: 'https://your-project.supabase.co',
        description: 'URL вашего Supabase проекта'
    },
    'SUPABASE_ANON_KEY': {
        required: true,
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Анонимный ключ Supabase (anon/public key)'
    }
};

const optionalVars = {
    'WEBHOOK_PORT': {
        required: false,
        example: '3001',
        description: 'Порт для webhook сервера',
        default: '3001'
    },
    'NODE_ENV': {
        required: false,
        example: 'development',
        description: 'Окружение (development/production)',
        default: 'development'
    },
    'TELEGRAM_BOT_TOKEN': {
        required: false,
        example: '1234567890:ABC...',
        description: 'Токен Telegram бота'
    }
};

console.log('🔍 Проверка обязательных переменных:\n');

let hasErrors = false;
let hasWarnings = false;

// Проверяем обязательные
for (const [key, config] of Object.entries(requiredVars)) {
    const value = process.env[key];
    
    if (!value || value.trim() === '') {
        error(`${key}: НЕ УСТАНОВЛЕН`);
        console.log(`   ${colors.blue}Описание: ${config.description}${colors.reset}`);
        console.log(`   ${colors.blue}Пример: ${config.example}${colors.reset}\n`);
        hasErrors = true;
    } else if (value.includes('your-project') || value.includes('your_') || value === config.example) {
        warning(`${key}: содержит placeholder значение`);
        console.log(`   ${colors.yellow}Замените на реальное значение из Supabase Dashboard${colors.reset}\n`);
        hasErrors = true;
    } else {
        success(`${key}: установлен`);
        // Показываем первые и последние символы для проверки
        const preview = value.length > 40 
            ? `${value.substring(0, 20)}...${value.substring(value.length - 10)}`
            : value;
        console.log(`   ${colors.blue}Значение: ${preview}${colors.reset}\n`);
    }
}

console.log('🔍 Проверка опциональных переменных:\n');

// Проверяем опциональные
for (const [key, config] of Object.entries(optionalVars)) {
    const value = process.env[key];
    
    if (!value || value.trim() === '') {
        warning(`${key}: не установлен`);
        console.log(`   ${colors.blue}Описание: ${config.description}${colors.reset}`);
        if (config.default) {
            console.log(`   ${colors.blue}По умолчанию будет использовано: ${config.default}${colors.reset}\n`);
        } else {
            console.log(`   ${colors.blue}Пример: ${config.example}${colors.reset}\n`);
        }
        hasWarnings = true;
    } else {
        success(`${key}: ${value}`);
    }
}

console.log('\n' + '='.repeat(60));

if (hasErrors) {
    console.log(`${colors.red}\n❌ Найдены критические проблемы с .env файлом!${colors.reset}`);
    console.log(`\n💡 Как получить правильные значения:`);
    console.log(`   1. Откройте https://app.supabase.com`);
    console.log(`   2. Выберите ваш проект`);
    console.log(`   3. Settings → API`);
    console.log(`   4. Скопируйте:`);
    console.log(`      - Project URL → SUPABASE_URL`);
    console.log(`      - anon/public key → SUPABASE_ANON_KEY\n`);
    process.exit(1);
} else if (hasWarnings) {
    console.log(`${colors.yellow}\n⚠️  Некоторые опциональные переменные не установлены${colors.reset}`);
    console.log(`${colors.green}✅ Обязательные переменные в порядке, можно работать!${colors.reset}\n`);
} else {
    console.log(`${colors.green}\n✅ Все переменные окружения настроены корректно!${colors.reset}\n`);
}

console.log('='.repeat(60) + '\n');

