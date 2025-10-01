/**
 * Simple in-memory rate limiter
 * Защита от spam/DDoS атак
 */

const requestCounts = new Map();

export function rateLimiter(options = {}) {
    const {
        windowMs = 60000, // 1 минута
        max = 10, // макс 10 запросов
        message = 'Too many requests, please try again later'
    } = options;

    return (req, res, next) => {
        // Используем IP или Telegram User ID
        const key = req.telegramUser?.id || req.ip || 'unknown';
        const now = Date.now();

        // Получаем или создаем запись для ключа
        if (!requestCounts.has(key)) {
            requestCounts.set(key, []);
        }

        const requests = requestCounts.get(key);

        // Фильтруем старые запросы
        const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);

        // Проверяем лимит
        if (recentRequests.length >= max) {
            console.warn(`⚠️ Rate limit exceeded for ${key}`);
            return res.status(429).json({
                success: false,
                error: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // Добавляем текущий запрос
        recentRequests.push(now);
        requestCounts.set(key, recentRequests);

        // Очищаем старые записи (каждые 5 минут)
        if (Math.random() < 0.01) {
            cleanupOldEntries(windowMs);
        }

        next();
    };
}

function cleanupOldEntries(windowMs) {
    const now = Date.now();
    for (const [key, timestamps] of requestCounts.entries()) {
        const recent = timestamps.filter(t => now - t < windowMs);
        if (recent.length === 0) {
            requestCounts.delete(key);
        } else {
            requestCounts.set(key, recent);
        }
    }
}

/**
 * Валидация и санитизация входных данных
 */
export function validateAndSanitize(req, res, next) {
    const { body } = req;

    // Проверка размера данных
    const bodySize = JSON.stringify(body).length;
    if (bodySize > 50000) { // 50KB макс
        return res.status(413).json({
            success: false,
            error: 'Payload too large'
        });
    }

    // Санитизация строк (защита от XSS)
    function sanitizeString(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/[<>]/g, '') // Удаляем < и >
            .trim()
            .slice(0, 500); // Макс длина 500 символов
    }

    // Санитизация email
    function sanitizeEmail(email) {
        if (typeof email !== 'string') return '';
        const cleaned = email.trim().toLowerCase();
        // Простая валидация email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
            return '';
        }
        return cleaned.slice(0, 100);
    }

    // Санитизация URL
    function sanitizeUrl(url) {
        if (!url) return '';
        try {
            const parsed = new URL(url);
            // Разрешаем только https
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return '';
            }
            return url.slice(0, 500);
        } catch {
            return '';
        }
    }

    // Применяем санитизацию
    if (body.firstName) body.firstName = sanitizeString(body.firstName);
    if (body.lastName) body.lastName = sanitizeString(body.lastName);
    if (body.email) body.email = sanitizeEmail(body.email);
    if (body.telegram) body.telegram = sanitizeString(body.telegram);
    if (body.profileLink) body.profileLink = sanitizeUrl(body.profileLink);
    if (body.geoPreference) body.geoPreference = sanitizeString(body.geoPreference);
    if (body.salaryExpectation) body.salaryExpectation = sanitizeString(body.salaryExpectation);
    
    // Валидация массивов
    if (body.skills && Array.isArray(body.skills)) {
        body.skills = body.skills.slice(0, 20).map(s => sanitizeString(s)); // Макс 20 навыков
    }

    next();
}

