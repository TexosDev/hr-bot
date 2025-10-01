import { supabase } from './supabase.js';

/**
 * Сервис для работы с опросами и тегами
 * Следует принципам SOLID, DRY, KISS
 */

/**
 * Получение всех активных вопросов опроса
 */
export async function getSurveyQuestions() {
  try {
    const { data, error } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Ошибка получения вопросов опроса:', error);
    return [];
  }
}

/**
 * Получение всех активных тегов
 */
export async function getTags(category = null) {
  try {
    let query = supabase
      .from('tags')
      .select('*')
      .eq('is_active', true);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query.order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Ошибка получения тегов:', error);
    return [];
  }
}

/**
 * Сохранение ответа пользователя на вопрос
 */
export async function saveSurveyResponse(userId, questionId, answer) {
  try {
    const responseData = {
      user_id: userId,
      question_id: questionId,
      ...answer
    };
    
    const { data, error } = await supabase
      .from('user_survey_responses')
      .upsert(responseData, { 
        onConflict: 'user_id,question_id',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Ошибка сохранения ответа:', error);
    return null;
  }
}

/**
 * Получение ответов пользователя на опрос
 */
export async function getUserSurveyResponses(userId) {
  try {
    const { data, error } = await supabase
      .from('user_survey_responses')
      .select(`
        *,
        survey_questions (
          question_text,
          question_type,
          options
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Ошибка получения ответов пользователя:', error);
    return [];
  }
}

/**
 * Создание подписки на основе опроса
 */
export async function createSurveyBasedSubscription(userId, userInfo, preferences) {
  try {
    const subscriptionData = {
      user_id: userId,
      username: userInfo.username || '',
      first_name: userInfo.first_name || '',
      subscription_type: 'survey_based',
      preferences: preferences,
      is_active: true
    };
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Ошибка создания подписки:', error);
    return null;
  }
}

/**
 * Получение подписки пользователя
 */
export async function getUserSubscription(userId) {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('❌ Ошибка получения подписки:', error);
    return null;
  }
}

/**
 * Связывание пользователя с тегами
 */
export async function linkUserToTags(userId, tagIds) {
  try {
    // Удаляем старые связи
    await supabase
      .from('user_tags')
      .delete()
      .eq('user_id', userId);
    
    // Добавляем новые связи
    const userTagData = tagIds.map(tagId => ({
      user_id: userId,
      tag_id: tagId,
      preference_level: 1
    }));
    
    const { data, error } = await supabase
      .from('user_tags')
      .insert(userTagData)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Ошибка связывания пользователя с тегами:', error);
    return null;
  }
}

/**
 * Получение тегов пользователя
 */
export async function getUserTags(userId) {
  try {
    const { data, error } = await supabase
      .from('user_tags')
      .select(`
        *,
        tags (
          name,
          category,
          description
        )
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Ошибка получения тегов пользователя:', error);
    return [];
  }
}

/**
 * Связывание вакансии с тегами
 */
export async function linkVacancyToTags(vacancyId, tagIds) {
  try {
    // Удаляем старые связи
    await supabase
      .from('vacancy_tags')
      .delete()
      .eq('vacancy_id', vacancyId);
    
    // Добавляем новые связи
    const vacancyTagData = tagIds.map(tagId => ({
      vacancy_id: vacancyId,
      tag_id: tagId,
      relevance_score: 1
    }));
    
    const { data, error } = await supabase
      .from('vacancy_tags')
      .insert(vacancyTagData)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Ошибка связывания вакансии с тегами:', error);
    return null;
  }
}

/**
 * Получение тегов вакансии
 */
export async function getVacancyTags(vacancyId) {
  try {
    const { data, error } = await supabase
      .from('vacancy_tags')
      .select(`
        *,
        tags (
          name,
          category,
          description
        )
      `)
      .eq('vacancy_id', vacancyId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Ошибка получения тегов вакансии:', error);
    return [];
  }
}

/**
 * Поиск вакансий по предпочтениям пользователя
 */
export async function findMatchingVacancies(userId) {
  try {
    // Получаем теги пользователя
    const userTags = await getUserTags(userId);
    const userTagIds = userTags.map(ut => ut.tag_id);
    
    if (userTagIds.length === 0) {
      return [];
    }
    
    // Ищем вакансии с совпадающими тегами
    const { data, error } = await supabase
      .from('vacancy_tags')
      .select(`
        vacancy_id,
        tags (
          name,
          category
        )
      `)
      .in('tag_id', userTagIds);
    
    if (error) throw error;
    
    // Группируем по вакансиям и считаем совпадения
    const vacancyMatches = {};
    data.forEach(vt => {
      if (!vacancyMatches[vt.vacancy_id]) {
        vacancyMatches[vt.vacancy_id] = {
          vacancy_id: vt.vacancy_id,
          matching_tags: [],
          score: 0
        };
      }
      vacancyMatches[vt.vacancy_id].matching_tags.push(vt.tags);
      vacancyMatches[vt.vacancy_id].score += 1;
    });
    
    return Object.values(vacancyMatches).sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('❌ Ошибка поиска подходящих вакансий:', error);
    return [];
  }
}
