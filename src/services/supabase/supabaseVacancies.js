import { supabase } from './supabase.js';

// Получение всех вакансий из Supabase
export async function getVacanciesFromSupabase() {
  try {
    console.log(' Получение вакансий из Supabase...');
    
    const { data, error } = await supabase
      .from('vacancies')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(' Ошибка получения вакансий:', error);
      return [];
    }
    
    console.log(` Получено ${data.length} вакансий из Supabase`);
    return data;
  } catch (error) {
    console.error(' Ошибка получения вакансий:', error);
    return [];
  }
}

// Получение вакансии по ID
export async function getVacancyByIdFromSupabase(vacancyId) {
  try {
    const { data, error } = await supabase
      .from('vacancies')
      .select('*')
      .eq('id', vacancyId)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error(' Ошибка получения вакансии:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(' Ошибка получения вакансии:', error);
    return null;
  }
}

// Алиас для совместимости
export const getVacancyById = getVacancyByIdFromSupabase;

// Добавление новой вакансии в Supabase
export async function addVacancyToSupabase(vacancyData) {
  try {
    console.log(' Добавление вакансии в Supabase...');
    
    const { data, error } = await supabase
      .from('vacancies')
      .insert([vacancyData])
      .select()
      .single();
    
    if (error) {
      console.error(' Ошибка добавления вакансии:', error);
      return null;
    }
    
    console.log(' Вакансия добавлена в Supabase');
    return data;
  } catch (error) {
    console.error(' Ошибка добавления вакансии:', error);
    return null;
  }
}

// Обновление вакансии в Supabase
export async function updateVacancyInSupabase(vacancyId, updateData) {
  try {
    console.log(' Обновление вакансии в Supabase...');
    
    const { data, error } = await supabase
      .from('vacancies')
      .update(updateData)
      .eq('id', vacancyId)
      .select()
      .single();
    
    if (error) {
      console.error(' Ошибка обновления вакансии:', error);
      return null;
    }
    
    console.log(' Вакансия обновлена в Supabase');
    return data;
  } catch (error) {
    console.error(' Ошибка обновления вакансии:', error);
    return null;
  }
}

// Удаление вакансии из Supabase (мягкое удаление)
export async function deleteVacancyFromSupabase(vacancyId) {
  try {
    console.log('� Удаление вакансии из Supabase...');
    
    const { error } = await supabase
      .from('vacancies')
      .update({ is_active: false })
      .eq('id', vacancyId);
    
    if (error) {
      console.error(' Ошибка удаления вакансии:', error);
      return false;
    }
    
    console.log(' Вакансия удалена из Supabase');
    return true;
  } catch (error) {
    console.error(' Ошибка удаления вакансии:', error);
    return false;
  }
}

// Получение вакансий по категории
export async function getVacanciesByCategoryFromSupabase(category) {
  try {
    const { data, error } = await supabase
      .from('vacancies')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(' Ошибка получения вакансий по категории:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(' Ошибка получения вакансий по категории:', error);
    return [];
  }
}
