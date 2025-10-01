#!/usr/bin/env node

/**
 * Скрипт для автоматического создания таблиц survey_categories и survey_fields в Supabase
 */

import { supabase } from '../src/services/supabase/supabase.js';
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

function info(message) {
    console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

async function createTables() {
    console.log('\n' + '='.repeat(60));
    console.log('🏗️  СОЗДАНИЕ ТАБЛИЦ ДЛЯ ВОПРОСОВ ОПРОСА');
    console.log('='.repeat(60) + '\n');

    // SQL для создания таблиц
    const createCategoriesSQL = `
        CREATE TABLE IF NOT EXISTS survey_categories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            category_key VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            icon VARCHAR(50),
            is_active BOOLEAN DEFAULT true,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;

    const createFieldsSQL = `
        CREATE TABLE IF NOT EXISTS survey_fields (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            category_key VARCHAR(100),
            field_key VARCHAR(100) NOT NULL,
            field_type VARCHAR(50) NOT NULL,
            label VARCHAR(255) NOT NULL,
            placeholder TEXT,
            options JSONB,
            is_required BOOLEAN DEFAULT false,
            is_common BOOLEAN DEFAULT false,
            display_order INTEGER DEFAULT 0,
            validation_rules JSONB,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(category_key, field_key)
        );
    `;

    const createIndexesSQL = `
        CREATE INDEX IF NOT EXISTS idx_survey_categories_key ON survey_categories(category_key);
        CREATE INDEX IF NOT EXISTS idx_survey_categories_active ON survey_categories(is_active);
        CREATE INDEX IF NOT EXISTS idx_survey_categories_order ON survey_categories(display_order);
        CREATE INDEX IF NOT EXISTS idx_survey_fields_category ON survey_fields(category_key);
        CREATE INDEX IF NOT EXISTS idx_survey_fields_common ON survey_fields(is_common);
        CREATE INDEX IF NOT EXISTS idx_survey_fields_active ON survey_fields(is_active);
        CREATE INDEX IF NOT EXISTS idx_survey_fields_order ON survey_fields(display_order);
    `;

    try {
        console.log('1️⃣  Создание таблицы survey_categories...');
        const { error: error1 } = await supabase.rpc('exec_sql', { sql: createCategoriesSQL });
        
        if (error1) {
            // Пробуем альтернативный способ через PostgREST
            info('Использую альтернативный метод создания таблицы...');
            info('Выполните SQL вручную в Supabase SQL Editor:');
            console.log('\n' + createCategoriesSQL + '\n');
        } else {
            success('Таблица survey_categories создана');
        }

        console.log('\n2️⃣  Создание таблицы survey_fields...');
        const { error: error2 } = await supabase.rpc('exec_sql', { sql: createFieldsSQL });
        
        if (error2) {
            info('Использую альтернативный метод создания таблицы...');
            info('Выполните SQL вручную в Supabase SQL Editor:');
            console.log('\n' + createFieldsSQL + '\n');
        } else {
            success('Таблица survey_fields создана');
        }

        console.log('\n3️⃣  Создание индексов...');
        const { error: error3 } = await supabase.rpc('exec_sql', { sql: createIndexesSQL });
        
        if (error3) {
            info('Индексы будут созданы при выполнении полного SQL скрипта');
        } else {
            success('Индексы созданы');
        }

        console.log('\n' + '='.repeat(60));
        error('⚠️  Supabase не позволяет создавать таблицы через API');
        console.log('='.repeat(60) + '\n');

        console.log('📋 Выполните вручную в Supabase SQL Editor:\n');
        console.log('1. Откройте: https://app.supabase.com');
        console.log('2. Выберите проект');
        console.log('3. SQL Editor → New Query');
        console.log('4. Скопируйте весь код из файла:');
        console.log(`   ${colors.yellow}database/survey-questions-schema.sql${colors.reset}`);
        console.log('5. Нажмите Run\n');

        console.log('💡 После создания таблиц запустите:');
        console.log(`   ${colors.green}npm run populate-questions${colors.reset} - заполнить Google Таблицу`);
        console.log(`   ${colors.green}npm run sync-questions${colors.reset} - синхронизировать в Supabase\n`);

    } catch (err) {
        console.error('\n❌ Ошибка:', err.message);
        
        console.log('\n📋 Выполните SQL вручную в Supabase:\n');
        console.log('1. Откройте Supabase Dashboard → SQL Editor');
        console.log('2. Скопируйте содержимое файла: database/survey-questions-schema.sql');
        console.log('3. Вставьте в SQL Editor');
        console.log('4. Нажмите Run\n');
    }
}

createTables();

