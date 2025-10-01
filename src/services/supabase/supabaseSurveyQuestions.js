import { supabase } from './supabase.js';

/**
 * Сервис для работы с вопросами опроса
 * KISS: Простые CRUD операции
 */

/**
 * Получить все активные категории
 */
export async function getSurveyCategories() {
    try {
        const { data, error } = await supabase
            .from('survey_categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) {
            console.error(' Ошибка получения категорий:', error);
            return [];
        }

        console.log(` Получено ${data.length} категорий`);
        return data;
    } catch (error) {
        console.error(' Ошибка получения категорий:', error);
        return [];
    }
}

/**
 * Получить поля для конкретной категории
 * @param {string} categoryKey - Ключ категории
 */
export async function getSurveyFieldsByCategory(categoryKey) {
    try {
        const { data, error } = await supabase
            .from('survey_fields')
            .select('*')
            .or(`category_key.eq.${categoryKey},category_key.is.null`) // Общие поля + поля категории
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) {
            console.error(' Ошибка получения полей:', error);
            return { common: [], extra: [] };
        }

        // Разделяем на общие и специфичные поля
        const commonFields = data.filter(f => f.is_common || f.category_key === null);
        const extraFields = data.filter(f => !f.is_common && f.category_key === categoryKey);

        console.log(` Получено ${commonFields.length} общих и ${extraFields.length} специфичных полей`);

        return {
            common: commonFields,
            extra: extraFields
        };
    } catch (error) {
        console.error(' Ошибка получения полей:', error);
        return { common: [], extra: [] };
    }
}

/**
 * Получить все поля в структурированном виде (как в questions.json)
 */
export async function getAllSurveyData() {
    try {
        // Получаем категории
        const categories = await getSurveyCategories();

        // Получаем все поля
        const { data: fields, error } = await supabase
            .from('survey_fields')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) {
            console.error(' Ошибка получения полей:', error);
            return null;
        }

        // Формируем структуру как в questions.json
        const result = {
            common_fields: {},
            categories: {}
        };

        // Заполняем общие поля
        fields
            .filter(f => f.is_common || f.category_key === null)
            .forEach(field => {
                result.common_fields[field.field_key] = {
                    type: field.field_type,
                    label: field.label,
                    ...(field.options && { options: field.options }),
                    ...(field.placeholder && { placeholder: field.placeholder }),
                    ...(field.is_required === false && { optional: true })
                };
            });

        // Заполняем поля по категориям
        categories.forEach(cat => {
            const categoryFields = fields.filter(f => f.category_key === cat.category_key);

            if (categoryFields.length > 0) {
                result.categories[cat.category_key] = {
                    extra_fields: {}
                };

                categoryFields.forEach(field => {
                    result.categories[cat.category_key].extra_fields[field.field_key] = {
                        type: field.field_type,
                        label: field.label,
                        ...(field.options && { options: field.options }),
                        ...(field.placeholder && { placeholder: field.placeholder })
                    };
                });
            }
        });

        console.log(' Сформирована структура вопросов');
        return result;

    } catch (error) {
        console.error(' Ошибка получения всех данных опроса:', error);
        return null;
    }
}

/**
 * Сохранить/обновить категорию
 */
export async function upsertCategory(categoryData) {
    try {
        const { data, error } = await supabase
            .from('survey_categories')
            .upsert({
                category_key: categoryData.category_key,
                name: categoryData.name,
                description: categoryData.description,
                icon: categoryData.icon,
                display_order: categoryData.display_order,
                is_active: categoryData.is_active !== false
            }, {
                onConflict: 'category_key'
            })
            .select()
            .single();

        if (error) {
            console.error(' Ошибка сохранения категории:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error(' Ошибка сохранения категории:', error);
        return null;
    }
}

/**
 * Сохранить/обновить поле
 */
export async function upsertField(fieldData) {
    try {
        const { data, error } = await supabase
            .from('survey_fields')
            .upsert({
                category_key: fieldData.category_key || null,
                field_key: fieldData.field_key,
                field_type: fieldData.field_type,
                label: fieldData.label,
                placeholder: fieldData.placeholder,
                options: fieldData.options,
                is_required: fieldData.is_required,
                is_common: fieldData.is_common,
                display_order: fieldData.display_order,
                is_active: fieldData.is_active !== false
            }, {
                onConflict: 'category_key,field_key'
            })
            .select()
            .single();

        if (error) {
            console.error(' Ошибка сохранения поля:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error(' Ошибка сохранения поля:', error);
        return null;
    }
}

