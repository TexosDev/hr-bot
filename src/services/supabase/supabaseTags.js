import { supabase } from './supabase.js';

export async function createTag(name, category, tagType, description = null) {
  try {
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name,
        category,
        tag_type: tagType,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания тега:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Ошибка создания тега:', error);
    return null;
  }
}

export async function getTagsByCategory(category) {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Ошибка получения тегов по категории:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка получения тегов по категории:', error);
    return [];
  }
}

export async function getTagsByType(tagType) {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('tag_type', tagType)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Ошибка получения тегов по типу:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка получения тегов по типу:', error);
    return [];
  }
}

export async function addTagsToVacancy(vacancyId, tagIds) {
  try {
    const tagsToInsert = tagIds.map(tagId => ({
      vacancy_id: vacancyId,
      tag_id: tagId
    }));

    const { data, error } = await supabase
      .from('vacancy_tags')
      .insert(tagsToInsert)
      .select();

    if (error) {
      console.error('Ошибка добавления тегов к вакансии:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Ошибка добавления тегов к вакансии:', error);
    return null;
  }
}

export async function getVacancyTags(vacancyId) {
  try {
    const { data, error } = await supabase
      .from('vacancy_tags')
      .select(`
        *,
        tags (
          id,
          name,
          category,
          tag_type,
          description
        )
      `)
      .eq('vacancy_id', vacancyId);

    if (error) {
      console.error('Ошибка получения тегов вакансии:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка получения тегов вакансии:', error);
    return [];
  }
}

export async function findMatchingVacancies(userId) {
  try {
    const { data, error } = await supabase
      .rpc('find_matching_vacancies', { user_id_param: userId });

    if (error) {
      console.error('Ошибка поиска подходящих вакансий:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка поиска подходящих вакансий:', error);
    return [];
  }
}

export async function getUserTags(userId) {
  try {
    const { data, error } = await supabase
      .from('user_tags')
      .select(`
        *,
        tags (
          id,
          name,
          category,
          tag_type,
          description
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Ошибка получения тегов пользователя:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка получения тегов пользователя:', error);
    return [];
  }
}

export async function createTagsFromArray(tagNames) {
  try {
    const createdTags = [];
    
    for (const tagName of tagNames) {
      // Проверяем, существует ли тег
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single();

      if (existingTag) {
        createdTags.push(existingTag);
        continue;
      }

      // Создаем новый тег
      const tag = await createTag(tagName, 'auto_generated', 'skill');
      if (tag) {
        createdTags.push(tag);
      }
    }

    return createdTags;
  } catch (error) {
    console.error('Ошибка создания тегов из массива:', error);
    return [];
  }
}

export async function updateUserTags(userId, tagIds) {
  try {
    // Удаляем старые теги пользователя
    await supabase
      .from('user_tags')
      .delete()
      .eq('user_id', userId);

    // Добавляем новые теги
    if (tagIds && tagIds.length > 0) {
      const userTagsToInsert = tagIds.map(tagId => ({
        user_id: userId,
        tag_id: tagId
      }));

      const { data, error } = await supabase
        .from('user_tags')
        .insert(userTagsToInsert)
        .select();

      if (error) {
        console.error('Ошибка обновления тегов пользователя:', error);
        return null;
      }

      return data;
    }

    return [];
  } catch (error) {
    console.error('Ошибка обновления тегов пользователя:', error);
    return null;
  }
}

