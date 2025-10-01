import { supabase } from './supabase.js';

// Добавление отклика в Supabase
export async function addResponseToSupabase(responseData) {
  try {
    console.log(' Добавление отклика в Supabase...');
    
    const { data, error } = await supabase
      .from('responses')
      .insert([responseData])
      .select()
      .single();
    
    if (error) {
      console.error(' Ошибка добавления отклика:', error);
      return null;
    }
    
    console.log(' Отклик добавлен в Supabase');
    return data;
  } catch (error) {
    console.error(' Ошибка добавления отклика:', error);
    return null;
  }
}

// Получение всех откликов из Supabase
export async function getResponsesFromSupabase() {
  try {
    console.log(' Получение откликов из Supabase...');
    
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(' Ошибка получения откликов:', error);
      return [];
    }
    
    console.log(` Получено ${data.length} откликов из Supabase`);
    return data;
  } catch (error) {
    console.error(' Ошибка получения откликов:', error);
    return [];
  }
}

// Получение откликов пользователя
export async function getUserResponsesFromSupabase(userId) {
  try {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(' Ошибка получения откликов пользователя:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(' Ошибка получения откликов пользователя:', error);
    return [];
  }
}

// Получение откликов по вакансии
export async function getResponsesByVacancyFromSupabase(vacancyId) {
  try {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('vacancy_id', vacancyId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(' Ошибка получения откликов по вакансии:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(' Ошибка получения откликов по вакансии:', error);
    return [];
  }
}

// Обновление статуса отклика
export async function updateResponseStatusInSupabase(responseId, status) {
  try {
    console.log(' Обновление статуса отклика в Supabase...');
    
    const { data, error } = await supabase
      .from('responses')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', responseId)
      .select()
      .single();
    
    if (error) {
      console.error(' Ошибка обновления статуса отклика:', error);
      return null;
    }
    
    console.log(' Статус отклика обновлен в Supabase');
    return data;
  } catch (error) {
    console.error(' Ошибка обновления статуса отклика:', error);
    return null;
  }
}

// Получение статистики откликов
export async function getResponsesStatsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('responses')
      .select('status, created_at');
    
    if (error) {
      console.error(' Ошибка получения статистики откликов:', error);
      return null;
    }
    
    // Группируем по статусам
    const stats = data.reduce((acc, response) => {
      acc[response.status] = (acc[response.status] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: data.length,
      by_status: stats,
      recent: data.filter(r => {
        const createdAt = new Date(r.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      }).length
    };
  } catch (error) {
    console.error(' Ошибка получения статистики откликов:', error);
    return null;
  }
}
