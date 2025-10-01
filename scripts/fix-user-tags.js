#!/usr/bin/env node

/**
 * Скрипт для исправления проблемы с user_tags
 * Создает user_tags для всех существующих user_preferences
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

/**
 * Создание user_tags из preferences
 */
async function createUserTagsFromPreferences(userId, preferences) {
    try {
        const tagNames = new Set();

        // Извлекаем теги из preferences
        if (preferences.technologies) {
            preferences.technologies.forEach(tech => tagNames.add(tech));
        }

        if (preferences.specialization) {
            preferences.specialization.forEach(spec => tagNames.add(spec));
        }

        if (preferences.experience) {
            preferences.experience.forEach(exp => tagNames.add(exp));
        }

        if (preferences.work_format) {
            preferences.work_format.forEach(wf => tagNames.add(wf));
        }

        const tagsArray = Array.from(tagNames);
        console.log(`   Найдено ${tagsArray.length} тегов: ${tagsArray.join(', ')}`);

        if (tagsArray.length === 0) {
            return 0;
        }

        // Удаляем старые теги пользователя
        await supabase
            .from('user_tags')
            .delete()
            .eq('user_id', userId);

        // Создаем новые теги
        const userTagsToInsert = tagsArray.map(tagName => ({
            user_id: userId,
            tag_name: tagName,
            preference_level: 1
        }));

        const { data, error } = await supabase
            .from('user_tags')
            .insert(userTagsToInsert);

        if (error) {
            console.error(`   ❌ Ошибка создания тегов:`, error);
            return 0;
        }

        console.log(`   ✅ Создано ${tagsArray.length} тегов`);
        return tagsArray.length;

    } catch (err) {
        console.error(`   ❌ Ошибка:`, err);
        return 0;
    }
}

async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С user_tags');
    console.log('='.repeat(70) + '\n');

    console.log('🔍 Получение всех пользователей из user_preferences...\n');

    // Получаем всех пользователей
    const { data: users, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('is_active', true);

    if (error) {
        error('Ошибка получения пользователей: ' + error.message);
        process.exit(1);
    }

    if (!users || users.length === 0) {
        info('Нет пользователей в user_preferences');
        console.log('\n💡 Это нормально если еще никто не заполнял форму\n');
        process.exit(0);
    }

    console.log(`📋 Найдено ${users.length} пользователей\n`);

    let totalTagsCreated = 0;

    for (const user of users) {
        console.log(`👤 Пользователь: ${user.first_name} (${user.username})`);
        console.log(`   ID: ${user.user_id}`);

        const tagsCreated = await createUserTagsFromPreferences(user.user_id, user.preferences);
        totalTagsCreated += tagsCreated;
        console.log('');
    }

    console.log('='.repeat(70));
    success(`\nВсего создано ${totalTagsCreated} тегов для ${users.length} пользователей\n`);
    console.log('='.repeat(70) + '\n');

    console.log('📋 Следующие шаги:');
    console.log('   1. Проверьте таблицу user_tags в Supabase');
    console.log('   2. Теперь matching должен работать');
    console.log('   3. Пользователи будут получать релевантные вакансии\n');
}

main().catch(err => {
    console.error('\n💥 Критическая ошибка:', err);
    process.exit(1);
});

