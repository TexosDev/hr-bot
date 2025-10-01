/**
 * Скрипт для проверки готовности WebApp системы
 * Проверяет: БД, API, конфигурацию
 */

import { supabase } from '../src/services/supabase/supabase.js';
import { saveUserPreferences } from '../src/services/supabase/supabaseUserPreferences.js';
import dotenv from 'dotenv';

dotenv.config();

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

async function checkEnvironment() {
    console.log('\n🔍 Проверка переменных окружения...\n');
    
    const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const optional = ['WEBHOOK_PORT', 'TELEGRAM_BOT_TOKEN'];
    
    let allGood = true;
    
    for (const key of required) {
        if (process.env[key]) {
            success(`${key}: настроен`);
        } else {
            error(`${key}: НЕ НАСТРОЕН`);
            allGood = false;
        }
    }
    
    for (const key of optional) {
        if (process.env[key]) {
            success(`${key}: настроен`);
        } else {
            warning(`${key}: не настроен (опционально)`);
        }
    }
    
    return allGood;
}

async function checkSupabaseConnection() {
    console.log('\n🔍 Проверка подключения к Supabase...\n');
    
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('count')
            .limit(1);
        
        if (error) {
            if (error.message.includes('relation') || error.message.includes('does not exist')) {
                error('Таблица user_preferences не существует');
                info('Выполните: database/simple-new-tables.sql в Supabase SQL Editor');
                return false;
            }
            throw error;
        }
        
        success('Подключение к Supabase работает');
        success('Таблица user_preferences существует');
        return true;
        
    } catch (err) {
        error(`Ошибка подключения к Supabase: ${err.message}`);
        return false;
    }
}

async function checkTableStructure() {
    console.log('\n🔍 Проверка структуры таблицы...\n');
    
    try {
        // Пытаемся вставить тестовую запись
        const testData = {
            user_id: 999999999,
            username: 'test_user',
            first_name: 'Test',
            preferences: {
                specialization: ['test'],
                technologies: ['test'],
                experience: ['test'],
                work_format: ['test'],
                source: 'system_test'
            },
            is_active: false,
            subscription_type: 'test'
        };
        
        const { data, error } = await supabase
            .from('user_preferences')
            .insert(testData)
            .select()
            .single();
        
        if (error) {
            if (error.message.includes('column')) {
                error(`Неправильная структура таблицы: ${error.message}`);
                info('Возможно нужно обновить схему таблицы');
                return false;
            }
            throw error;
        }
        
        // Удаляем тестовую запись
        await supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', 999999999);
        
        success('Структура таблицы корректна');
        success('Тестовая запись успешно создана и удалена');
        return true;
        
    } catch (err) {
        error(`Ошибка проверки структуры: ${err.message}`);
        return false;
    }
}

async function testSaveFunction() {
    console.log('\n🔍 Тестирование функции сохранения...\n');
    
    try {
        const testUser = {
            id: `test_${Date.now()}`,
            username: 'test_webapp_user',
            first_name: 'Test',
            last_name: 'User'
        };
        
        const testPreferences = {
            specialization: ['frontend'],
            technologies: ['React', 'TypeScript'],
            experience: ['2-3 года'],
            work_format: ['Удалёнка'],
            location: 'Test Location',
            salary_range: '100000',
            source: 'system_test',
            completed_at: new Date().toISOString()
        };
        
        const result = await saveUserPreferences(testUser.id, testUser, testPreferences);
        
        if (!result) {
            error('Функция saveUserPreferences вернула null');
            return false;
        }
        
        success('Функция saveUserPreferences работает');
        info(`Создана тестовая запись с ID: ${result.id}`);
        
        // Удаляем тестовую запись
        const { error: deleteError } = await supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', testUser.id);
        
        if (!deleteError) {
            success('Тестовая запись успешно удалена');
        }
        
        return true;
        
    } catch (err) {
        error(`Ошибка тестирования функции: ${err.message}`);
        return false;
    }
}

async function checkAPIEndpoint() {
    console.log('\n🔍 Проверка API endpoint...\n');
    
    try {
        const port = process.env.WEBHOOK_PORT || 3001;
        const url = `http://localhost:${port}/health`;
        
        info(`Проверяем: ${url}`);
        
        const response = await fetch(url);
        
        if (response.ok) {
            success('API сервер работает');
            success(`Endpoint /health доступен на порту ${port}`);
            return true;
        } else {
            warning(`API сервер вернул статус ${response.status}`);
            return false;
        }
        
    } catch (err) {
        warning('API сервер не запущен');
        info('Запустите: npm run dev-server');
        return false;
    }
}

async function generateReport(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ИТОГОВЫЙ ОТЧЕТ');
    console.log('='.repeat(60) + '\n');
    
    const checks = [
        { name: 'Переменные окружения', result: results.env },
        { name: 'Подключение к Supabase', result: results.supabase },
        { name: 'Структура таблицы', result: results.structure },
        { name: 'Функция сохранения', result: results.save },
        { name: 'API сервер', result: results.api }
    ];
    
    let passedCount = 0;
    
    checks.forEach(check => {
        if (check.result) {
            success(check.name);
            passedCount++;
        } else {
            error(check.name);
        }
    });
    
    console.log('\n' + '='.repeat(60));
    
    const percentage = Math.round((passedCount / checks.length) * 100);
    
    if (percentage === 100) {
        console.log(`${colors.green}🎉 Все проверки пройдены! Система готова к работе!${colors.reset}`);
    } else if (percentage >= 60) {
        console.log(`${colors.yellow}⚠️  Пройдено ${passedCount}/${checks.length} проверок (${percentage}%)${colors.reset}`);
        console.log(`${colors.yellow}   Исправьте проблемы перед использованием${colors.reset}`);
    } else {
        console.log(`${colors.red}❌ Критические проблемы! Пройдено ${passedCount}/${checks.length} проверок (${percentage}%)${colors.reset}`);
        console.log(`${colors.red}   Система не готова к работе${colors.reset}`);
    }
    
    console.log('='.repeat(60) + '\n');
    
    if (percentage < 100) {
        console.log('📖 Инструкции по настройке: webapp/SETUP.md\n');
    }
}

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 ПРОВЕРКА ГОТОВНОСТИ WEBAPP СИСТЕМЫ');
    console.log('='.repeat(60));
    
    const results = {
        env: await checkEnvironment(),
        supabase: await checkSupabaseConnection(),
        structure: false,
        save: false,
        api: await checkAPIEndpoint()
    };
    
    // Проверяем структуру только если подключение работает
    if (results.supabase) {
        results.structure = await checkTableStructure();
        results.save = await testSaveFunction();
    }
    
    await generateReport(results);
    
    process.exit(results.env && results.supabase && results.structure && results.save ? 0 : 1);
}

main().catch(err => {
    console.error('\n💥 Критическая ошибка:', err);
    process.exit(1);
});

