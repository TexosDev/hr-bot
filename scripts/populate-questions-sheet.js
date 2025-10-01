#!/usr/bin/env node

/**
 * Скрипт для заполнения Google Таблицы данными из questions.json
 * Создает листы "Категории" и "Поля" и заполняет их
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Цвета для консоли
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

// Инициализация Google API
const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
);

const sheetsService = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.GOOGLE_QUESTIONS_SHEET_ID || process.env.GOOGLE_SHEET_ID;

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ЗАПОЛНЕНИЕ GOOGLE ТАБЛИЦЫ ИЗ questions.json');
    console.log('='.repeat(60) + '\n');

    // Проверка конфигурации
    if (!SHEET_ID) {
        error('GOOGLE_QUESTIONS_SHEET_ID не найден в .env');
        info('Добавьте: GOOGLE_QUESTIONS_SHEET_ID=ваш_id_таблицы\n');
        process.exit(1);
    }

    if (!process.env.GOOGLE_SERVICE_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        error('Google Service Account не настроен');
        info('Проверьте GOOGLE_SERVICE_EMAIL и GOOGLE_PRIVATE_KEY в .env\n');
        process.exit(1);
    }

    success('Конфигурация проверена');
    info(`Таблица ID: ${SHEET_ID}\n`);

    // Читаем questions.json
    console.log('📖 Чтение questions.json...\n');
    
    const questionsPath = path.join(__dirname, '../webapp/questions.json');
    const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

    // Преобразуем данные для категорий
    const categoriesData = [];
    categoriesData.push(['category_key', 'name', 'description', 'icon', 'display_order', 'is_active']); // Заголовок

    let order = 1;
    for (const [categoryKey, categoryData] of Object.entries(questionsData.categories)) {
        const categoryName = getCategoryName(categoryKey);
        const description = getCategoryDescription(categoryKey);
        const icon = getCategoryIcon(categoryKey);
        
        categoriesData.push([
            categoryKey,
            categoryName,
            description,
            icon,
            order++,
            'TRUE'
        ]);
    }

    success(`Подготовлено ${categoriesData.length - 1} категорий`);

    // Преобразуем данные для полей
    const fieldsData = [];
    fieldsData.push(['category_key', 'field_key', 'field_type', 'label', 'placeholder', 'options', 'is_required', 'is_common', 'display_order']); // Заголовок

    // Общие поля
    let fieldOrder = 1;
    for (const [fieldKey, fieldData] of Object.entries(questionsData.common_fields)) {
        const options = fieldData.options ? fieldData.options.join(', ') : '';
        const isRequired = !fieldData.optional;
        
        fieldsData.push([
            '', // category_key пустой для общих полей
            fieldKey,
            fieldData.type,
            fieldData.label,
            fieldData.placeholder || '',
            options,
            isRequired ? 'TRUE' : 'FALSE',
            'TRUE', // is_common
            fieldOrder++
        ]);
    }

    success(`Подготовлено ${fieldOrder - 1} общих полей`);

    // Специфичные поля для каждой категории
    for (const [categoryKey, categoryData] of Object.entries(questionsData.categories)) {
        if (!categoryData.extra_fields) continue;

        let catFieldOrder = 1;
        for (const [fieldKey, fieldData] of Object.entries(categoryData.extra_fields)) {
            const options = fieldData.options ? fieldData.options.join(', ') : '';
            
            fieldsData.push([
                categoryKey,
                fieldKey,
                fieldData.type,
                fieldData.label,
                fieldData.placeholder || '',
                options,
                'FALSE', // По умолчанию необязательные
                'FALSE', // is_common
                catFieldOrder++
            ]);
        }
    }

    success(`Подготовлено ${fieldsData.length - 1} полей всего\n`);

    // Создаем/обновляем листы в Google Таблице
    console.log('📝 Заполнение Google Таблицы...\n');

    try {
        // Проверяем существование листов
        const spreadsheet = await sheetsService.spreadsheets.get({
            spreadsheetId: SHEET_ID
        });

        const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);
        info(`Существующие листы: ${existingSheets.join(', ')}`);

        // Создаем лист "Категории" если не существует
        if (!existingSheets.includes('Категории')) {
            await sheetsService.spreadsheets.batchUpdate({
                spreadsheetId: SHEET_ID,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Категории'
                            }
                        }
                    }]
                }
            });
            success('Создан лист "Категории"');
        } else {
            info('Лист "Категории" уже существует');
        }

        // Создаем лист "Поля" если не существует
        if (!existingSheets.includes('Поля')) {
            await sheetsService.spreadsheets.batchUpdate({
                spreadsheetId: SHEET_ID,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Поля'
                            }
                        }
                    }]
                }
            });
            success('Создан лист "Поля"');
        } else {
            info('Лист "Поля" уже существует');
        }

        // Заполняем лист "Категории"
        console.log('\n1️⃣  Заполнение листа "Категории"...');
        await sheetsService.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: 'Категории!A1',
            valueInputOption: 'RAW',
            requestBody: {
                values: categoriesData
            }
        });
        success(`Записано ${categoriesData.length - 1} категорий`);

        // Заполняем лист "Поля"
        console.log('\n2️⃣  Заполнение листа "Поля"...');
        await sheetsService.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: 'Поля!A1',
            valueInputOption: 'RAW',
            requestBody: {
                values: fieldsData
            }
        });
        success(`Записано ${fieldsData.length - 1} полей`);

        // Форматируем заголовки (жирный текст)
        await sheetsService.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: {
                requests: [
                    {
                        repeatCell: {
                            range: {
                                sheetId: getSheetId(spreadsheet.data.sheets, 'Категории'),
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    textFormat: { bold: true },
                                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                                }
                            },
                            fields: 'userEnteredFormat(textFormat,backgroundColor)'
                        }
                    },
                    {
                        repeatCell: {
                            range: {
                                sheetId: getSheetId(spreadsheet.data.sheets, 'Поля'),
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    textFormat: { bold: true },
                                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                                }
                            },
                            fields: 'userEnteredFormat(textFormat,backgroundColor)'
                        }
                    }
                ]
            }
        });

        success('Форматирование применено\n');

        console.log('='.repeat(60));
        console.log(`${colors.green}🎉 GOOGLE ТАБЛИЦА УСПЕШНО ЗАПОЛНЕНА!${colors.reset}`);
        console.log('='.repeat(60) + '\n');

        console.log('📋 Следующие шаги:');
        console.log('   1. Откройте таблицу и проверьте данные');
        console.log(`   2. https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`);
        console.log('   3. При необходимости отредактируйте');
        console.log('   4. Синхронизируйте: npm run sync-questions\n');

    } catch (err) {
        console.error('\n❌ Ошибка заполнения таблицы:', err.message);
        
        if (err.message.includes('permission')) {
            error('Недостаточно прав доступа');
            info('Проверьте что таблица расшарена для сервисного аккаунта');
            info(`Email: ${process.env.GOOGLE_SERVICE_EMAIL}\n`);
        }
        
        process.exit(1);
    }
}

// Вспомогательные функции
function getSheetId(sheets, title) {
    const sheet = sheets.find(s => s.properties.title === title);
    return sheet ? sheet.properties.sheetId : 0;
}

function getCategoryName(key) {
    const names = {
        frontend: 'Frontend Development',
        backend: 'Backend Development',
        fullstack: 'Fullstack Development',
        devops_infra: 'DevOps / Infrastructure',
        mobile: 'Mobile Development',
        data_ai: 'Data / AI',
        qa_test: 'QA / Testing',
        security: 'Security',
        product: 'Product Management',
        project_management: 'Project Management',
        ux_ui_design: 'UX/UI Design',
        digital_marketing: 'Digital Marketing',
        support_it: 'IT Support',
        crypto: 'Crypto / Blockchain',
        c_level: 'C-Level / Executive',
        igaming: 'iGaming'
    };
    return names[key] || key;
}

function getCategoryDescription(key) {
    const descriptions = {
        frontend: 'Разработка пользовательских интерфейсов',
        backend: 'Серверная разработка и API',
        fullstack: 'Полный цикл разработки',
        devops_infra: 'Инфраструктура и автоматизация',
        mobile: 'Мобильная разработка',
        data_ai: 'Анализ данных и машинное обучение',
        qa_test: 'Тестирование и обеспечение качества',
        security: 'Информационная безопасность',
        product: 'Продуктовый менеджмент',
        project_management: 'Управление проектами',
        ux_ui_design: 'Дизайн пользовательского интерфейса',
        digital_marketing: 'Цифровой маркетинг',
        support_it: 'IT поддержка',
        crypto: 'Блокчейн и криптовалюты',
        c_level: 'Топ-менеджмент',
        igaming: 'Онлайн казино и беттинг'
    };
    return descriptions[key] || '';
}

function getCategoryIcon(key) {
    const icons = {
        frontend: '🎨',
        backend: '⚙️',
        fullstack: '🚀',
        devops_infra: '🔧',
        mobile: '📱',
        data_ai: '📊',
        qa_test: '🧪',
        security: '🔒',
        product: '📋',
        project_management: '📅',
        ux_ui_design: '✏️',
        digital_marketing: '📈',
        support_it: '🛠️',
        crypto: '₿',
        c_level: '👔',
        igaming: '🎰'
    };
    return icons[key] || '📋';
}

main().catch(err => {
    console.error('\n💥 Критическая ошибка:', err);
    process.exit(1);
});

