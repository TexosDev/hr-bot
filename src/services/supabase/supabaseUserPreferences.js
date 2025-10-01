import { supabase } from './supabase.js';


export async function saveUserPreferences(userId, userInfo, preferences) {
  try {
    console.log(' Сохранение предпочтений пользователя...');
    console.log('   User ID:', userId, 'Type:', typeof userId);
    
    // Убеждаемся что userId - число
    const numericUserId = typeof userId === 'string' ? parseInt(userId) : userId;
    
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: numericUserId,
        username: userInfo.username || '',
        first_name: userInfo.first_name || '',
        preferences: preferences,
        is_active: true,
        subscription_type: 'survey_based'
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (error) {
      console.error(' Ошибка сохранения предпочтений:', error);
      return null;
    }
    
    console.log(' Предпочтения сохранены успешно!');
    console.log('   ID записи:', data.id);

    // Автоматически создаем user_tags из preferences
    await createUserTagsFromPreferences(numericUserId, preferences);
    
    return data;
  } catch (error) {
    console.error(' Ошибка сохранения предпочтений:', error);
    return null;
  }
}

/**
 * Создание user_tags из preferences
 * КРИТИЧНО: Без этого matching не работает!
 */
async function createUserTagsFromPreferences(userId, preferences) {
  try {
    console.log('�  Создание тегов пользователя...');
    
    const tagNames = new Set();

    // Извлекаем все теги из preferences
    if (preferences.technologies) {
      preferences.technologies.forEach(tech => tagNames.add(tech));
    }

    if (preferences.specialization) {
      preferences.specialization.forEach(spec => tagNames.add(spec));
    }

    if (preferences.experience) {
      preferences.experience.forEach(exp => tagNames.add(exp));
    }

    if (preferences.work_format) {
      preferences.work_format.forEach(wf => tagNames.add(wf));
    }

    const tagsArray = Array.from(tagNames);
    console.log(`   Найдено ${tagsArray.length} уникальных тегов`);

    if (tagsArray.length === 0) {
      console.log('    Нет тегов для создания');
      return;
    }

    // Удаляем старые теги пользователя
    await supabase
      .from('user_tags')
      .delete()
      .eq('user_id', userId);

    // Создаем новые теги
    const userTagsToInsert = tagsArray.map(tagName => ({
      user_id: userId,
      tag_name: tagName,
      preference_level: 1
    }));

    const { error } = await supabase
      .from('user_tags')
      .insert(userTagsToInsert);

    if (error) {
      console.error('    Ошибка создания тегов:', error);
      return;
    }

    console.log(`    Создано ${tagsArray.length} тегов: ${tagsArray.join(', ')}`);

    // Убеждаемся что теги существуют в справочнике tags
    await ensureTagsExist(tagsArray);

  } catch (error) {
    console.error(' Ошибка создания user_tags:', error);
  }
}

/**
 * Убедиться что теги существуют в справочнике tags
 */
async function ensureTagsExist(tagNames) {
  try {
    for (const tagName of tagNames) {
      // Проверяем существование
      const { data: existing } = await supabase
        .from('tags')
        .select('name')
        .eq('name', tagName)
        .single();

      if (!existing) {
        // Создаем тег
        const category = detectTagCategory(tagName);
        
        await supabase
          .from('tags')
          .insert({
            name: tagName,
            category: category,
            description: `Автоматически созданный тег: ${tagName}`,
            is_active: true
          });

        console.log(`   � Создан новый тег в справочнике: ${tagName} (${category})`);
      }
    }
  } catch (error) {
    // Игнорируем ошибки (не критично)
    console.warn('    Предупреждение при создании тегов:', error.message);
  }
}

/**
 * Определить категорию тега
 */
function detectTagCategory(tagName) {
  const tech = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'TypeScript', 'JavaScript', 'Go', 'Java', 'PHP'];
  const directions = ['Frontend', 'Backend', 'Fullstack', 'Mobile', 'DevOps', 'QA', 'Design', 'Marketing'];
  const experience = ['Junior', 'Middle', 'Senior', 'Lead', 'Без опыта', '< 1 года', '1-2 года', '2-3 года', '3-5 лет', '5+ лет'];
  const workTypes = ['Офис', 'Удалёнка', 'Гибрид', 'Удаленно', 'В офисе'];

  if (tech.some(t => tagName.includes(t))) return 'technology';
  if (directions.some(d => tagName.includes(d))) return 'direction';
  if (experience.some(e => tagName.includes(e))) return 'experience';
  if (workTypes.some(w => tagName.includes(w))) return 'work_type';

  return 'other';
}

export async function getUserPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error(' Ошибка получения предпочтений:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(' Ошибка получения предпочтений:', error);
    return null;
  }
}

/**
 * Обновление предпочтений пользователя
 * KISS: Простая логика обновления
 */
export async function updateUserPreferences(userId, preferences) {
  try {
    console.log(' Обновление предпочтений пользователя...');
    
    const { data, error } = await supabase
      .from('user_preferences')
      .update({
        preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error(' Ошибка обновления предпочтений:', error);
      return null;
    }
    
    console.log(' Предпочтения обновлены');
    return data;
  } catch (error) {
    console.error(' Ошибка обновления предпочтений:', error);
    return null;
  }
}

/**
 * Деактивация подписки пользователя
 * SOLID: Отдельная ответственность
 */
export async function deactivateUserSubscription(userId) {
  try {
    console.log('� Деактивация подписки пользователя...');
    
    const { error } = await supabase
      .from('user_preferences')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) {
      console.error(' Ошибка деактивации подписки:', error);
      return false;
    }
    
    console.log(' Подписка деактивирована');
    return true;
  } catch (error) {
    console.error(' Ошибка деактивации подписки:', error);
    return false;
  }
}

/**
 * Получение всех активных подписчиков
 * DRY: Переиспользуемая логика
 */
export async function getAllActiveSubscribers() {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error(' Ошибка получения подписчиков:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(' Ошибка получения подписчиков:', error);
    return [];
  }
}

/**
 * Получение статистики подписок
 * SOLID: Отдельная ответственность для аналитики
 */
export async function getSubscriptionStats() {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('preferences, created_at, is_active');
    
    if (error) {
      console.error(' Ошибка получения статистики:', error);
      return null;
    }
    
    const stats = {
      total: data.length,
      active: data.filter(s => s.is_active).length,
      by_direction: {},
      by_technology: {},
      by_experience: {},
      recent: data.filter(s => {
        const createdAt = new Date(s.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      }).length
    };
    
    // Анализируем предпочтения
    data.forEach(subscription => {
      const prefs = subscription.preferences;
      
      // Направления
      if (prefs.directions) {
        prefs.directions.forEach(dir => {
          stats.by_direction[dir] = (stats.by_direction[dir] || 0) + 1;
        });
      }
      
      // Технологии
      if (prefs.technologies) {
        prefs.technologies.forEach(tech => {
          stats.by_technology[tech] = (stats.by_technology[tech] || 0) + 1;
        });
      }
      
      // Опыт
      if (prefs.experience) {
        prefs.experience.forEach(exp => {
          stats.by_experience[exp] = (stats.by_experience[exp] || 0) + 1;
        });
      }
    });
    
    return stats;
  } catch (error) {
    console.error(' Ошибка получения статистики:', error);
    return null;
  }
}

/**
 * Поиск подходящих пользователей для вакансии
 * SOLID: Отдельная ответственность для поиска
 */
export async function findMatchingUsers(vacancyId) {
  try {
    console.log(` Поиск подходящих пользователей для вакансии ${vacancyId}...`);
    
    const { data, error } = await supabase
      .rpc('find_matching_users', { vacancy_id: vacancyId });
    
    if (error) {
      console.error(' Ошибка поиска подходящих пользователей:', error);
      return [];
    }
    
    console.log(` Найдено ${data.length} подходящих пользователей`);
    return data;
  } catch (error) {
    console.error(' Ошибка поиска подходящих пользователей:', error);
    return [];
  }
}

/**
 * Проверка, подписан ли пользователь
 * KISS: Простая проверка
 */
export async function isUserSubscribed(userId) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error(' Ошибка проверки подписки:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(' Ошибка проверки подписки:', error);
    return false;
  }
}
