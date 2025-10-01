import { google } from 'googleapis';
import { upsertCategory, upsertField } from './supabaseSurveyQuestions.js';

/**
 * Синхронизация вопросов опроса из Google Sheets в Supabase
 * KISS: Простая логика синхронизации
 */

// Инициализация Google API
const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
);

const sheetsService = google.sheets({ version: 'v4', auth });
const QUESTIONS_SHEET_ID = process.env.GOOGLE_QUESTIONS_SHEET_ID || process.env.GOOGLE_SHEET_ID;

/**
 * Синхронизация категорий из Google Sheets
 * Лист "Категории": category_key | name | description | icon | display_order | is_active
 */
export async function syncCategories() {
    try {
        console.log('🔄 Синхронизация категорий из Google Sheets...');

        const response = await sheetsService.spreadsheets.values.get({
            spreadsheetId: QUESTIONS_SHEET_ID,
            range: 'Категории!A:F'
        });

        const rows = response.data.values || [];

        if (rows.length <= 1) {
            console.log('⚠️ Нет данных в листе "Категории"');
            return { success: true, synced: 0 };
        }

        let syncedCount = 0;

        // Пропускаем заголовок
        for (const row of rows.slice(1)) {
            if (!row[0]) continue; // Пропускаем пустые строки

            const categoryData = {
                category_key: row[0]?.trim(),
                name: row[1]?.trim() || row[0],
                description: row[2]?.trim() || '',
                icon: row[3]?.trim() || '📋',
                display_order: parseInt(row[4]) || 0,
                is_active: row[5]?.toLowerCase() !== 'false'
            };

            const result = await upsertCategory(categoryData);
            if (result) {
                syncedCount++;
                console.log(`  ✅ ${categoryData.name}`);
            }
        }

        console.log(`✅ Синхронизировано ${syncedCount} категорий`);
        return { success: true, synced: syncedCount };

    } catch (error) {
        console.error('❌ Ошибка синхронизации категорий:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Синхронизация полей из Google Sheets
 * Лист "Поля": category_key | field_key | field_type | label | placeholder | options | is_required | is_common | display_order
 */
export async function syncFields() {
    try {
        console.log('🔄 Синхронизация полей из Google Sheets...');

        const response = await sheetsService.spreadsheets.values.get({
            spreadsheetId: QUESTIONS_SHEET_ID,
            range: 'Поля!A:I'
        });

        const rows = response.data.values || [];

        if (rows.length <= 1) {
            console.log('⚠️ Нет данных в листе "Поля"');
            return { success: true, synced: 0 };
        }

        let syncedCount = 0;

        // Пропускаем заголовок
        for (const row of rows.slice(1)) {
            if (!row[1]) continue; // Пропускаем строки без field_key

            // Парсим опции из строки в JSON
            let options = null;
            if (row[5]) {
                try {
                    // Если это список через запятую: "Опция 1, Опция 2, Опция 3"
                    if (row[5].includes(',')) {
                        options = row[5].split(',').map(opt => opt.trim()).filter(opt => opt);
                    } else {
                        // Если это уже JSON
                        options = JSON.parse(row[5]);
                    }
                } catch (e) {
                    console.warn(`⚠️ Не удалось распарсить опции для ${row[1]}: ${row[5]}`);
                }
            }

            const fieldData = {
                category_key: row[0]?.trim() || null, // NULL = общее поле
                field_key: row[1]?.trim(),
                field_type: row[2]?.trim() || 'string',
                label: row[3]?.trim() || row[1],
                placeholder: row[4]?.trim() || null,
                options: options,
                is_required: row[6]?.toLowerCase() === 'true',
                is_common: row[7]?.toLowerCase() === 'true',
                display_order: parseInt(row[8]) || 0
            };

            const result = await upsertField(fieldData);
            if (result) {
                syncedCount++;
                const category = fieldData.category_key || 'общее';
                console.log(`  ✅ [${category}] ${fieldData.label}`);
            }
        }

        console.log(`✅ Синхронизировано ${syncedCount} полей`);
        return { success: true, synced: syncedCount };

    } catch (error) {
        console.error('❌ Ошибка синхронизации полей:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Полная синхронизация вопросов
 */
export async function syncSurveyQuestions() {
    try {
        console.log('🚀 Запуск полной синхронизации вопросов опроса...\n');

        // 1. Синхронизируем категории
        const categoriesResult = await syncCategories();

        // 2. Синхронизируем поля
        const fieldsResult = await syncFields();

        console.log('\n🎉 Синхронизация вопросов завершена!');
        console.log(`📊 Результаты:`);
        console.log(`  - Категории: ${categoriesResult.synced} синхронизировано`);
        console.log(`  - Поля: ${fieldsResult.synced} синхронизировано`);

        return {
            success: true,
            categories: categoriesResult,
            fields: fieldsResult
        };

    } catch (error) {
        console.error('❌ Ошибка полной синхронизации вопросов:', error);
        return { success: false, error: error.message };
    }
}

