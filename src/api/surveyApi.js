import express from 'express';
import { saveUserPreferences } from '../services/supabase/supabaseUserPreferences.js';
import { telegramWebAppAuth } from '../middleware/telegramAuth.js';
import { rateLimiter, validateAndSanitize } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/complete',
    rateLimiter({ windowMs: 60000, max: 3 }),
    validateAndSanitize,
    telegramWebAppAuth,
    async (req, res) => {
    try {
        const {
            firstName, lastName, email, telegram,
            category, skills, experienceYears, workFormat,
            geoPreference, salaryExpectation, profileLink,
            hasResumeFile,
            telegramUserId
        } = req.body;

        console.log('Получен запрос на сохранение предпочтений от пользователя:', telegramUserId || 'anonymous');

        if (!firstName || !lastName || !email || !telegram || !category || !skills || !experienceYears || !workFormat) {
            return res.status(400).json({
                success: false,
                error: 'Отсутствуют обязательные поля'
            });
        }

        const userId = telegramUserId || -Math.abs(Date.now());
        
        const user = {
            id: userId,
            first_name: firstName,
            last_name: lastName,
            username: telegram.replace('@', ''),
            telegram_username: telegram
        };

        const preferences = {
            specialization: [category],
            technologies: skills,
            experience: [experienceYears],
            work_format: [workFormat],
            location: geoPreference || '',
            salary_range: salaryExpectation || '',
            resume_link: profileLink || '',
            has_resume: hasResumeFile || false,
            source: 'webapp',
            completed_at: new Date().toISOString()
        };

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

router.get('/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        res.json({
            success: true,
            hasCompletedSurvey: false,
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
