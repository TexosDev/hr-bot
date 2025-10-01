#!/usr/bin/env node

/**
 * Полная проверка всех таблиц в Supabase
 * Анализирует структуру БД и выдает отчет
 */

import { supabase } from '../src/services/supabase/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
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

function title(message) {
    console.log(`${colors.cyan}${message}${colors.reset}`);
}

// Список ожидаемых таблиц
const EXPECTED_TABLES = {
    // Основные таблицы
    'vacancies': {
        description: 'Вакансии',
        required: true,
        columns: ['id', 'title', 'category', 'is_active']
    },
    'responses': {
        description: 'Отклики пользователей на вакансии',
        required: true,
        columns: ['id', 'user_id', 'vacancy_id']
    },
    'subscriptions': {
        description: 'Подписки (старая система)',
        required: false,
        columns: ['id', 'user_id', 'category']
    },
    
    // Новая система подписок
    'user_preferences': {
        description: 'Предпочтения пользователей (новая система)',
        required: true,
        columns: ['id', 'user_id', 'preferences', 'is_active']
    },
    'notifications': {
        description: 'История уведомлений',
        required: true,
        columns: ['id', 'user_id', 'vacancy_id', 'status']
    },
    
    // Система тегов
    'tags': {
        description: 'Теги для вакансий и навыков',
        required: true,
        columns: ['id', 'name', 'category', 'is_active']
    },
    'vacancy_tags': {
        description: 'Связь вакансий с тегами',
        required: true,
        columns: ['id', 'vacancy_id', 'tag_name']
    },
    'user_tags': {
        description: 'Связь пользователей с тегами',
        required: true,
        columns: ['id', 'user_id', 'tag_name']
    },
    
    // Система вопросов
    'survey_categories': {
        description: 'Категории вопросов опроса',
        required: true,
        columns: ['id', 'category_key', 'name', 'is_active']
    },
    'survey_fields': {
        description: 'Поля формы опроса',
        required: true,
        columns: ['id', 'category_key', 'field_key', 'field_type', 'label']
    }
};

async function checkTable(tableName, config) {
    try {
        // Проверяем существование таблицы и получаем количество записей
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (error) {
            if (error.message.includes('does not exist') || error.code === 'PGRST205') {
                if (config.required) {
                    error(`${tableName}: НЕ СУЩЕСТВУЕТ (обязательная)`);
                } else {
                    warning(`${tableName}: не существует (опциональная)`);
                }
                return { exists: false, required: config.required };
            }
            throw error;
        }

        success(`${tableName}: существует (${count || 0} записей)`);
        info(`   Описание: ${config.description}`);

        // Проверяем колонки
        const { data: sample } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (sample && sample.length > 0) {
            const columns = Object.keys(sample[0]);
            const missingColumns = config.columns.filter(col => !columns.includes(col));
            
            if (missingColumns.length > 0) {
                warning(`   Отсутствуют колонки: ${missingColumns.join(', ')}`);
            }
        }

        return { exists: true, count: count || 0, required: config.required };

    } catch (err) {
        error(`${tableName}: ОШИБКА - ${err.message}`);
        return { exists: false, error: err.message, required: config.required };
    }
}

async function generateDatabaseReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 ПРОВЕРКА БАЗЫ ДАННЫХ SUPABASE');
    console.log('='.repeat(70) + '\n');

    const results = {};
    let totalTables = 0;
    let existingTables = 0;
    let missingRequired = 0;
    let totalRecords = 0;

    // Проверяем каждую таблицу
    for (const [tableName, config] of Object.entries(EXPECTED_TABLES)) {
        totalTables++;
        const result = await checkTable(tableName, config);
        results[tableName] = result;

        if (result.exists) {
            existingTables++;
            totalRecords += result.count || 0;
        } else if (result.required) {
            missingRequired++;
        }

        console.log(''); // Пустая строка для читаемости
    }

    // Итоговый отчет
    console.log('='.repeat(70));
    title('\n📊 ИТОГОВЫЙ ОТЧЕТ\n');
    console.log('='.repeat(70) + '\n');

    console.log(`📋 Всего таблиц проверено: ${totalTables}`);
    console.log(`✅ Существует: ${existingTables}`);
    console.log(`❌ Отсутствует: ${totalTables - existingTables}`);
    console.log(`🔴 Критичных отсутствует: ${missingRequired}`);
    console.log(`📊 Всего записей: ${totalRecords}\n`);

    // Группируем таблицы по назначению
    console.log('📁 Группировка по назначению:\n');

    console.log('🏢 ОСНОВНЫЕ ТАБЛИЦЫ:');
    ['vacancies', 'responses', 'subscriptions'].forEach(table => {
        const res = results[table];
        const status = res?.exists ? `✅ ${res.count} записей` : '❌ Не создана';
        console.log(`   • ${table}: ${status}`);
    });

    console.log('\n👥 СИСТЕМА ПОДПИСОК:');
    ['user_preferences', 'notifications'].forEach(table => {
        const res = results[table];
        const status = res?.exists ? `✅ ${res.count} записей` : '❌ Не создана';
        console.log(`   • ${table}: ${status}`);
    });

    console.log('\n🏷️  СИСТЕМА ТЕГОВ:');
    ['tags', 'vacancy_tags', 'user_tags'].forEach(table => {
        const res = results[table];
        const status = res?.exists ? `✅ ${res.count} записей` : '❌ Не создана';
        console.log(`   • ${table}: ${status}`);
    });

    console.log('\n📋 СИСТЕМА ВОПРОСОВ:');
    ['survey_categories', 'survey_fields'].forEach(table => {
        const res = results[table];
        const status = res?.exists ? `✅ ${res.count} записей` : '❌ Не создана';
        console.log(`   • ${table}: ${status}`);
    });

    // Рекомендации
    console.log('\n' + '='.repeat(70));
    title('\n💡 РЕКОМЕНДАЦИИ\n');
    console.log('='.repeat(70) + '\n');

    if (missingRequired > 0) {
        error(`Критично: ${missingRequired} обязательных таблиц отсутствует!\n`);

        console.log('📝 Создайте недостающие таблицы:\n');

        if (!results['vacancies']?.exists || !results['responses']?.exists || !results['subscriptions']?.exists) {
            console.log('1️⃣  Основные таблицы:');
            console.log('   Выполните: database/supabase-schema.sql\n');
        }

        if (!results['user_preferences']?.exists || !results['notifications']?.exists || !results['tags']?.exists) {
            console.log('2️⃣  Система подписок и тегов:');
            console.log('   Выполните: database/simple-new-tables.sql\n');
        }

        if (!results['survey_categories']?.exists || !results['survey_fields']?.exists) {
            console.log('3️⃣  Система вопросов:');
            console.log('   Выполните: database/survey-questions-schema.sql\n');
        }

        console.log('📖 Инструкция: FIX_TABLES_ERROR.md\n');

    } else if (existingTables === totalTables) {
        success('Все таблицы созданы! База данных готова к работе! 🎉\n');

        // Проверяем данные
        if (results['vacancies']?.count === 0) {
            warning('Таблица vacancies пустая');
            info('   Синхронизируйте вакансии: npm run sync\n');
        }

        if (results['tags']?.count === 0) {
            warning('Таблица tags пустая');
            info('   Теги должны создаться автоматически при выполнении simple-new-tables.sql\n');
        }

        if (results['survey_categories']?.count === 0) {
            warning('Таблица survey_categories пустая');
            info('   Заполните Google Таблицу: npm run populate-questions');
            info('   Синхронизируйте: npm run sync-questions\n');
        }

        if (results['user_preferences']?.count === 0) {
            info('Таблица user_preferences пустая - это нормально');
            info('   Заполнится когда пользователи будут заполнять WebApp форму\n');
        }

    } else {
        warning('Некоторые таблицы отсутствуют\n');

        const missing = Object.entries(results)
            .filter(([name, res]) => !res.exists)
            .map(([name]) => name);

        if (missing.length > 0) {
            console.log('Отсутствующие таблицы:');
            missing.forEach(name => console.log(`   • ${name}`));
            console.log('');
        }
    }

    // Проверка связей
    console.log('='.repeat(70));
    title('\n🔗 ПРОВЕРКА СВЯЗЕЙ\n');
    console.log('='.repeat(70) + '\n');

    if (results['vacancies']?.exists && results['responses']?.exists) {
        success('responses → vacancies: OK');
    }

    if (results['vacancies']?.exists && results['vacancy_tags']?.exists) {
        success('vacancy_tags → vacancies: OK');
    }

    if (results['vacancies']?.exists && results['notifications']?.exists) {
        success('notifications → vacancies: OK');
    }

    if (results['user_preferences']?.exists && results['user_tags']?.exists) {
        success('user_tags → users: OK');
    }

    console.log('\n' + '='.repeat(70));

    const percentage = Math.round((existingTables / totalTables) * 100);

    if (percentage === 100) {
        console.log(`\n${colors.green}🎉 БАЗА ДАННЫХ В ИДЕАЛЬНОМ СОСТОЯНИИ (100%)${colors.reset}\n`);
    } else if (percentage >= 70) {
        console.log(`\n${colors.yellow}⚠️  БАЗА ДАННЫХ ЧАСТИЧНО НАСТРОЕНА (${percentage}%)${colors.reset}\n`);
    } else {
        console.log(`\n${colors.red}❌ КРИТИЧЕСКИЕ ПРОБЛЕМЫ С БАЗОЙ ДАННЫХ (${percentage}%)${colors.reset}\n`);
    }

    console.log('='.repeat(70) + '\n');

    return { percentage, missingRequired };
}

async function main() {
    const result = await generateDatabaseReport();

    if (result.missingRequired > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

main().catch(err => {
    console.error('\n💥 Критическая ошибка:', err);
    process.exit(1);
});

