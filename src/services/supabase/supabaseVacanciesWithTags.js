import { supabase } from './supabase.js';

/**
 * Сервис для работы с вакансиями и тегами
 * Следует принципам SOLID, DRY, KISS
 */

/**
 * Синхронизация вакансий с тегами из Google Sheets
 * SOLID: Единственная ответственность
 */
export async function syncVacanciesWithTagsFromSheets(sheetsData) {
  try {
    console.log(' Синхронизация вакансий с тегами...');
    
    const vacancies = sheetsData.map((row, index) => {
      // Парсим теги из строки (предполагаем, что теги в колонке J)
      const tagsString = row[9] || ''; // Колонка J с тегами
      const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      
      return {
        title: row[0] || '',
        description: row[1] || '',
        emoji: row[2] || '�',
        category: row[3] || 'Общее',
        link: row[4] || '',
        level: row[5] || '',
        salary: row[6] || '',
        requirements: row[7] || '',
        benefits: row[8] || '',
        tags: tags,
        salary_min: this.parseSalary(row[6], 'min'),
        salary_max: this.parseSalary(row[6], 'max'),
        work_type: this.detectWorkType(row[1] + ' ' + row[7]), // Анализируем описание и требования
        experience_level: this.detectExperienceLevel(row[5]),
        location: this.detectLocation(row[1] + ' ' + row[7]),
        is_active: true
      };
    }).filter(v => v.title); // Фильтруем пустые строки
    
    console.log(` Найдено ${vacancies.length} вакансий с тегами`);
    
    if (vacancies.length === 0) {
      return { success: true, synced: 0, updated: 0 };
    }
    
    let syncedCount = 0;
    let updatedCount = 0;
    
    // Получаем существующие вакансии для сравнения
    const { data: existingVacancies, error: fetchError } = await supabase
      .from('vacancies')
      .select('id, title, category, tags');
    
    if (fetchError) {
      console.error(' Ошибка получения существующих вакансий:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    const existingMap = new Map();
    existingVacancies.forEach(vacancy => {
      const key = `${vacancy.title}_${vacancy.category}`;
      existingMap.set(key, vacancy);
    });
    
    // Обрабатываем каждую вакансию
    for (const vacancy of vacancies) {
      const key = `${vacancy.title}_${vacancy.category}`;
      
      if (existingMap.has(key)) {
        // Обновляем существующую вакансию
        const existingVacancy = existingMap.get(key);
        const { error: updateError } = await supabase
          .from('vacancies')
          .update(vacancy)
          .eq('id', existingVacancy.id);
        
        if (updateError) {
          console.error(` Ошибка обновления вакансии ${vacancy.title}:`, updateError);
        } else {
          updatedCount++;
          console.log(` Обновлена вакансия: ${vacancy.title}`);
          
          // Обновляем теги вакансии
          await this.updateVacancyTags(existingVacancy.id, vacancy.tags);
        }
      } else {
        // Добавляем новую вакансию
        const { data: newVacancy, error: insertError } = await supabase
          .from('vacancies')
          .insert([vacancy])
          .select()
          .single();
        
        if (insertError) {
          console.error(` Ошибка добавления вакансии ${vacancy.title}:`, insertError);
        } else {
          syncedCount++;
          console.log(` Добавлена новая вакансия: ${vacancy.title}`);
          
          // Добавляем теги вакансии
          await this.updateVacancyTags(newVacancy.id, vacancy.tags);
        }
      }
    }
    
    console.log(` Синхронизация завершена: ${syncedCount} новых, ${updatedCount} обновленных`);
    return { success: true, synced: syncedCount, updated: updatedCount };
    
  } catch (error) {
    console.error(' Ошибка синхронизации вакансий с тегами:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Обновление тегов вакансии
 * DRY: Переиспользуемая логика
 * ИСПРАВЛЕНО: Использует tag_name вместо tag_id для совместимости с simple-new-tables.sql
 */
async function updateVacancyTags(vacancyId, tags) {
  try {
    // Удаляем старые теги
    await supabase
      .from('vacancy_tags')
      .delete()
      .eq('vacancy_id', vacancyId);
    
    // Добавляем новые теги
    if (tags && tags.length > 0) {
      const tagRecords = tags.map(tagName => ({
        vacancy_id: vacancyId,
        tag_name: tagName,
        relevance_score: 1
      }));
      
      const { error } = await supabase
        .from('vacancy_tags')
        .insert(tagRecords);

      if (error) {
        console.error(` Ошибка вставки тегов:`, error);
        return;
      }

      // Убеждаемся что теги существуют в справочнике
      await ensureTagsExistInDirectory(tags);
    }
    
    console.log(`    Теги вакансии обновлены: ${tags.join(', ')}`);
  } catch (error) {
    console.error(` Ошибка обновления тегов для вакансии ${vacancyId}:`, error);
  }
}

/**
 * Убедиться что теги есть в справочнике tags
 */
async function ensureTagsExistInDirectory(tagNames) {
  try {
    for (const tagName of tagNames) {
      const { data: existing } = await supabase
        .from('tags')
        .select('name')
        .eq('name', tagName)
        .maybeSingle();

      if (!existing) {
        // Автоматически создаем тег
        const category = detectTagCategory(tagName);
        
        await supabase
          .from('tags')
          .insert({
            name: tagName,
            category: category,
            description: `Тег из вакансии: ${tagName}`,
            is_active: true
          });
      }
    }
  } catch (error) {
    // Игнорируем ошибки дубликатов
  }
}

/**
 * Определить категорию тега
 */
function detectTagCategory(tagName) {
  const lowerTag = tagName.toLowerCase();
  
  // Технологии
  if (lowerTag.match(/(react|vue|angular|node|python|java|php|go|rust|typescript|javascript)/)) {
    return 'technology';
  }
  
  // Направления
  if (lowerTag.match(/(frontend|backend|fullstack|mobile|devops|qa|design|marketing)/)) {
    return 'direction';
  }
  
  // Опыт
  if (lowerTag.match(/(junior|middle|senior|lead|без опыта|года|лет)/)) {
    return 'experience';
  }
  
  // Формат работы
  if (lowerTag.match(/(офис|удалёнка|гибрид|удаленно)/)) {
    return 'work_type';
  }
  
  return 'other';
}

/**
 * Парсинг зарплаты из строки
 * KISS: Простая логика парсинга
 */
function parseSalary(salaryString, type) {
  if (!salaryString) return null;
  
  // Ищем числа в строке зарплаты
  const numbers = salaryString.match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;
  
  const nums = numbers.map(n => parseInt(n));
  
  if (type === 'min') {
    return Math.min(...nums);
  } else if (type === 'max') {
    return Math.max(...nums);
  }
  
  return null;
}

/**
 * Определение типа работы из текста
 * KISS: Простая логика определения
 */
function detectWorkType(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('удален') || lowerText.includes('remote')) {
    return 'Удаленка';
  } else if (lowerText.includes('офис') || lowerText.includes('office')) {
    return 'Офис';
  } else if (lowerText.includes('гибрид') || lowerText.includes('hybrid')) {
    return 'Гибрид';
  }
  
  return 'Любой'; // По умолчанию
}

/**
 * Определение уровня опыта
 * KISS: Простая логика определения
 */
function detectExperienceLevel(levelString) {
  if (!levelString) return 'Любой';
  
  const lowerLevel = levelString.toLowerCase();
  
  if (lowerLevel.includes('junior') || lowerLevel.includes('младший')) {
    return 'Junior';
  } else if (lowerLevel.includes('middle') || lowerLevel.includes('средний')) {
    return 'Middle';
  } else if (lowerLevel.includes('senior') || lowerLevel.includes('старший')) {
    return 'Senior';
  } else if (lowerLevel.includes('lead') || lowerLevel.includes('лид')) {
    return 'Lead';
  }
  
  return 'Любой';
}

/**
 * Определение локации
 * KISS: Простая логика определения
 */
function detectLocation(text) {
  const lowerText = text.toLowerCase();
  
  // Список городов для поиска
  const cities = [
    'москва', 'санкт-петербург', 'екатеринбург', 'новосибирск',
    'казань', 'нижний новгород', 'челябинск', 'самара',
    'омск', 'ростов-на-дону', 'уфа', 'красноярск'
  ];
  
  for (const city of cities) {
    if (lowerText.includes(city)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  
  return 'Не указано';
}

/**
 * Получение вакансий с тегами
 * DRY: Переиспользуемая логика
 */
export async function getVacanciesWithTags() {
  try {
    const { data, error } = await supabase
      .from('vacancies')
      .select(`
        *,
        vacancy_tags (
          tags (
            name,
            category
          ),
          relevance_score
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(' Ошибка получения вакансий с тегами:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(' Ошибка получения вакансий с тегами:', error);
    return [];
  }
}

/**
 * Поиск вакансий по тегам
 * SOLID: Отдельная ответственность для поиска
 */
export async function findVacanciesByTags(tags, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('vacancies')
      .select(`
        *,
        vacancy_tags (
          tags (
            name,
            category
          ),
          relevance_score
        )
      `)
      .eq('is_active', true)
      .overlaps('tags', tags)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error(' Ошибка поиска вакансий по тегам:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(' Ошибка поиска вакансий по тегам:', error);
    return [];
  }
}

/**
 * Получение всех уникальных тегов
 * DRY: Переиспользуемая логика
 */
export async function getAllTags() {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error(' Ошибка получения тегов:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(' Ошибка получения тегов:', error);
    return [];
  }
}
