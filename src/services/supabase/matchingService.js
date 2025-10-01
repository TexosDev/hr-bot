import { supabase } from './supabase.js';

/**
 * Сервис для поиска релевантных вакансий для пользователя
 * ИСПРАВЛЕНО: Работает с tag_name (VARCHAR) вместо tag_id (UUID)
 * KISS: Простая логика без сложных JOIN
 */

/**
 * Найти подходящие вакансии для пользователя
 * @param {number} userId - ID пользователя
 * @returns {Array} Массив подходящих вакансий
 */
export async function findMatchingVacancies(userId) {
    try {
        console.log(` Поиск подходящих вакансий для пользователя ${userId}...`);

        // 1. Получаем теги пользователя
        const { data: userTags, error: userTagsError } = await supabase
            .from('user_tags')
            .select('tag_name')
            .eq('user_id', userId);

        if (userTagsError) {
            console.error(' Ошибка получения тегов пользователя:', userTagsError);
            return [];
        }

        if (!userTags || userTags.length === 0) {
            console.log('    У пользователя нет тегов');
            return [];
        }

        const userTagNames = userTags.map(t => t.tag_name);
        console.log(`   Теги пользователя: ${userTagNames.join(', ')}`);

        // 2. Получаем ID уже отправленных вакансий
        const { data: sentNotifications } = await supabase
            .from('notifications')
            .select('vacancy_id')
            .eq('user_id', userId);

        const sentVacancyIds = sentNotifications ? sentNotifications.map(n => n.vacancy_id) : [];

        // 3. Находим вакансии с совпадающими тегами
        const { data: matchingVacancyTags, error: matchError } = await supabase
            .from('vacancy_tags')
            .select('vacancy_id, tag_name')
            .in('tag_name', userTagNames);

        if (matchError) {
            console.error(' Ошибка поиска совпадений:', matchError);
            return [];
        }

        if (!matchingVacancyTags || matchingVacancyTags.length === 0) {
            console.log('   � Нет вакансий с подходящими тегами');
            return [];
        }

        // 4. Группируем по vacancy_id и подсчитываем совпадения
        const vacancyScores = {};
        
        matchingVacancyTags.forEach(vt => {
            if (!vacancyScores[vt.vacancy_id]) {
                vacancyScores[vt.vacancy_id] = {
                    id: vt.vacancy_id,
                    matchCount: 0,
                    matchedTags: []
                };
            }
            vacancyScores[vt.vacancy_id].matchCount++;
            vacancyScores[vt.vacancy_id].matchedTags.push(vt.tag_name);
        });

        // 5. Фильтруем вакансии (минимум 2 совпадения, не отправленные ранее)
        const vacancyIds = Object.entries(vacancyScores)
            .filter(([id, score]) => score.matchCount >= 2 && !sentVacancyIds.includes(id))
            .sort(([, a], [, b]) => b.matchCount - a.matchCount) // Сортируем по количеству совпадений
            .slice(0, 5) // Топ 5 вакансий
            .map(([id]) => id);

        if (vacancyIds.length === 0) {
            console.log('   � Нет новых подходящих вакансий');
            return [];
        }

        // 6. Получаем полные данные вакансий
        const { data: vacancies, error: vacError } = await supabase
            .from('vacancies')
            .select('*')
            .in('id', vacancyIds)
            .eq('is_active', true);

        if (vacError) {
            console.error(' Ошибка получения вакансий:', vacError);
            return [];
        }

        // 7. Добавляем информацию о совпадениях
        const enrichedVacancies = vacancies.map(v => ({
            ...v,
            matchCount: vacancyScores[v.id].matchCount,
            matchedTags: vacancyScores[v.id].matchedTags
        }));

        // Сортируем по релевантности
        enrichedVacancies.sort((a, b) => b.matchCount - a.matchCount);

        console.log(`    Найдено ${enrichedVacancies.length} подходящих вакансий`);
        enrichedVacancies.forEach(v => {
            console.log(`      • ${v.title} (${v.matchCount} совпадений: ${v.matchedTags.join(', ')})`);
        });

        return enrichedVacancies;

    } catch (error) {
        console.error(' Критическая ошибка поиска вакансий:', error);
        return [];
    }
}

/**
 * Получить теги пользователя
 * @param {number} userId - ID пользователя
 * @returns {Array} Массив тегов
 */
export async function getUserTags(userId) {
    try {
        const { data, error } = await supabase
            .from('user_tags')
            .select('tag_name, preference_level')
            .eq('user_id', userId);

        if (error) {
            console.error(' Ошибка получения тегов пользователя:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error(' Ошибка получения тегов пользователя:', error);
        return [];
    }
}

/**
 * Получить теги вакансии
 * @param {string} vacancyId - UUID вакансии
 * @returns {Array} Массив тегов
 */
export async function getVacancyTags(vacancyId) {
    try {
        const { data, error } = await supabase
            .from('vacancy_tags')
            .select('tag_name, relevance_score')
            .eq('vacancy_id', vacancyId);

        if (error) {
            console.error(' Ошибка получения тегов вакансии:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error(' Ошибка получения тегов вакансии:', error);
        return [];
    }
}

