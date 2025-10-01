import crypto from 'crypto';

/**
 * Валидация данных Telegram WebApp
 * Защита от подделки запросов
 */
export function validateTelegramWebAppData(initData, botToken) {
    try {
        if (!initData || typeof initData !== 'string') {
            return { valid: false, error: 'Invalid initData format' };
        }

        // Парсим initData
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        params.delete('hash');

        // Создаем строку для проверки
        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Создаем секретный ключ
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        // Вычисляем хеш
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        // Сравниваем хеши
        if (calculatedHash !== hash) {
            return { valid: false, error: 'Invalid hash' };
        }

        // Проверяем время (данные не старше 24 часов)
        const authDate = parseInt(params.get('auth_date'));
        const now = Math.floor(Date.now() / 1000);
        const maxAge = 86400; // 24 часа

        if (now - authDate > maxAge) {
            return { valid: false, error: 'Data expired' };
        }

        // Парсим данные пользователя
        const userStr = params.get('user');
        const user = userStr ? JSON.parse(userStr) : null;

        return {
            valid: true,
            user,
            authDate
        };

    } catch (error) {
        console.error('❌ Ошибка валидации Telegram данных:', error);
        return { valid: false, error: error.message };
    }
}

/**
 * Middleware для защиты API endpoints
 */
export function telegramWebAppAuth(req, res, next) {
    const initData = req.headers['x-telegram-init-data'];
    const botToken = process.env.BOT_TOKEN;

    if (!botToken) {
        console.error('❌ BOT_TOKEN не настроен');
        return res.status(500).json({
            success: false,
            error: 'Server configuration error'
        });
    }

    // В development режиме можем пропускать валидацию
    if (process.env.NODE_ENV === 'development' && !initData) {
        console.warn('⚠️ Development: пропускаем проверку Telegram auth');
        return next();
    }

    if (!initData) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Missing Telegram data'
        });
    }

    const validation = validateTelegramWebAppData(initData, botToken);

    if (!validation.valid) {
        console.warn('⚠️ Неудачная валидация Telegram данных:', validation.error);
        return res.status(403).json({
            success: false,
            error: 'Forbidden: Invalid Telegram data'
        });
    }

    // Добавляем проверенные данные пользователя в request
    req.telegramUser = validation.user;
    req.telegramAuthDate = validation.authDate;

    next();
}

