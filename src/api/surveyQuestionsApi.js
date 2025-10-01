import express from 'express';
import { getSurveyCategories, getSurveyFieldsByCategory, getAllSurveyData } from '../services/supabase/supabaseSurveyQuestions.js';

const router = express.Router();

/**
 * API для получения вопросов опроса из Supabase
 * KISS: Простые GET endpoints
 */

/**
 * Получить все категории
 * GET /api/questions/categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await getSurveyCategories();

        res.json({
            success: true,
            categories: categories.map(cat => ({
                id: cat.category_key,
                name: cat.name,
                description: cat.description,
                icon: cat.icon
            }))
        });

    } catch (error) {
        console.error('❌ Ошибка получения категорий:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения категорий'
        });
    }
});

/**
 * Получить поля для категории
 * GET /api/questions/categories/:categoryKey/fields
 */
router.get('/categories/:categoryKey/fields', async (req, res) => {
    try {
        const { categoryKey } = req.params;
        const fields = await getSurveyFieldsByCategory(categoryKey);

        // Преобразуем в удобный формат
        const commonFields = {};
        const extraFields = {};

        fields.common.forEach(field => {
            commonFields[field.field_key] = {
                type: field.field_type,
                label: field.label,
                ...(field.placeholder && { placeholder: field.placeholder }),
                ...(field.options && { options: field.options }),
                ...(field.is_required && { required: true })
            };
        });

        fields.extra.forEach(field => {
            extraFields[field.field_key] = {
                type: field.field_type,
                label: field.label,
                ...(field.placeholder && { placeholder: field.placeholder }),
                ...(field.options && { options: field.options }),
                ...(field.is_required && { required: true })
            };
        });

        res.json({
            success: true,
            fields: {
                common: commonFields,
                extra: extraFields
            }
        });

    } catch (error) {
        console.error('❌ Ошибка получения полей:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения полей'
        });
    }
});

/**
 * Получить все данные опроса (как questions.json)
 * GET /api/questions/all
 */
router.get('/all', async (req, res) => {
    try {
        const data = await getAllSurveyData();

        if (!data) {
            return res.status(500).json({
                success: false,
                error: 'Ошибка получения данных'
            });
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('❌ Ошибка получения всех данных:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения данных'
        });
    }
});

export default router;

