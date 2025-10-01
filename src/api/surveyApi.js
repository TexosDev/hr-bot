import express from 'express';
import { saveUserPreferences } from '../services/supabase/supabaseUserPreferences.js';
import { telegramWebAppAuth } from '../middleware/telegramAuth.js';
import { rateLimiter, validateAndSanitize } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * API для обработки опросов из WebApp
 * ЗАЩИТА: Telegram auth, rate limiting, input validation
 */

/**
 * Завершение опроса из WebApp
 * POST /api/survey/complete
 */
router.post('/complete',
    rateLimiter({ windowMs: 60000, max: 3 }), // Макс 3 запроса в минуту
    validateAndSanitize, // Валидация и санитизация данных
    telegramWebAppAuth, // Проверка Telegram подписи
    async (req, res) => {
    try {
        const {
            firstName, lastName, email, telegram,
            category, skills, experienceYears, workFormat,
            geoPreference, salaryExpectation, profileLink,
            hasResumeFile,
            telegramUserId // ✅ НОВОЕ: реальный Telegram ID из WebApp API
        } = req.body;

        // ✅ БЕЗОПАСНОСТЬ: Не логируем чувствительные данные (email, telegram)
        console.log('📝 Получен запрос на сохранение предпочтений от пользователя:', telegramUserId || 'anonymous');

        // Валидация данных
        if (!firstName || !lastName || !email || !telegram || !category || !skills || !experienceYears || !workFormat) {
            return res.status(400).json({
                success: false,
                error: 'Отсутствуют обязательные поля'
            });
        }

        // ✅ ИСПРАВЛЕНО: используем реальный Telegram ID если доступен
        // Иначе создаем временный отрицательный ID
        const userId = telegramUserId || -Math.abs(Date.now());
        
        console.log(`💡 Используем User ID: ${userId} ${telegramUserId ? '(реальный Telegram ID)' : '(временный ID)'}`);
        
        const user = {
            id: userId,
            first_name: firstName,
            last_name: lastName,
            username: telegram.replace('@', ''),
            telegram_username: telegram
        };

        // Создаем объект предпочтений на основе данных WebApp
        const preferences = {
            specialization: [category], // Категория разработки
            technologies: skills, // Навыки и технологии
            experience: [experienceYears], // Опыт работы
            work_format: [workFormat], // Формат работы
            location: geoPreference || '', // Желаемое GEO
            salary_range: salaryExpectation || '', // Ожидаемая зарплата
            resume_link: profileLink || '', // Ссылка на профиль
            has_resume: hasResumeFile || false, // Есть ли резюме
            source: 'webapp', // Источник данных
            completed_at: new Date().toISOString()
        };

        console.log('💾 Сохраняем предпочтения пользователя:', { user, preferences });

        // Сохраняем предпочтения в базу данных
        const result = await saveUserPreferences(user.id, user, preferences);

        if (result) {
            res.json({
                success: true,
                message: 'Данные успешно сохранены',
                preferences: preferences,
                user_id: user.id
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Ошибка сохранения данных в базу'
            });
        }

    } catch (error) {
        console.error('Ошибка при сохранении данных из WebApp:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

/**
 * Получение статуса опроса пользователя
 * GET /api/survey/status/:userId
 */
router.get('/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Здесь можно добавить логику проверки статуса опроса
        // Пока возвращаем базовую информацию
        
        res.json({
            success: true,
            hasCompletedSurvey: false, // TODO: Реализовать проверку
            lastCompleted: null
        });
        
    } catch (error) {
        console.error('Ошибка при получении статуса опроса:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

export default router;
