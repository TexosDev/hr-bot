import { google } from 'googleapis';

// Создание сервиса для работы с Google Sheets
export function createVacanciesService(auth) {
  return google.sheets({ version: 'v4', auth });
}

// Получение вакансий из Google Sheets
export async function getVacanciesFromSheet(sheetsService, sheetId, range = 'A:I') {
  try {
    console.log('📋 Получение вакансий из Google Sheets...');
    console.log('📋 ID таблицы:', sheetId);
    console.log('📋 Диапазон:', range);

    const response = await sheetsService.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('⚠️ Нет данных о вакансиях в таблице');
      return [];
    }

    // Пропускаем заголовок (первую строку)
    const vacancies = rows.slice(1).map((row, index) => ({
      id: `vacancy_${index + 1}`,
      title: row[0] || `Вакансия ${index + 1}`,
      description: row[1] || 'Описание не указано',
      emoji: row[2] || '💼',
      category: row[3] || 'Другие',
      link: row[4] || '',
      level: row[5] || '',
      salary: row[6] || '',
      requirements: row[7] || '',
      benefits: row[8] || ''
    }));

    console.log(`✅ Получено ${vacancies.length} вакансий из Google Sheets`);
    return vacancies;

  } catch (error) {
    console.error('❌ Ошибка получения вакансий из Google Sheets:', error);
    console.log('⚠️ Возвращаем пустой список вакансий');
    return [];
  }
}


// Создание главного меню с категориями (динамически из Google Sheets)
export function createMainMenuKeyboard(vacancies) {
  const categories = groupVacanciesByCategory(vacancies);
  const keyboard = [];
  const webAppUrl = process.env.WEBAPP_URL || `http://localhost:3001/webapp/index.html`;
  
  // Если нет вакансий, возвращаем пустое меню
  if (Object.keys(categories).length === 0) {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔔 Подписаться на обновления', web_app: { url: webAppUrl } }],
          [{ text: '💬 Связаться с админом', url: `https://t.me/${process.env.ADMIN_USERNAME || 'admin'}` }]
        ]
      }
    };
  }
  
  // Создаем кнопки категорий динамически
  Object.entries(categories).forEach(([category, categoryVacancies]) => {
    const categoryKey = category.toLowerCase().replace(/\s+/g, '_');
    keyboard.push([{
      text: `${category} (${categoryVacancies.length})`,
      callback_data: `category_${categoryKey}`
    }]);
  });
  
  // Добавляем кнопки навигации
  keyboard.push([
    { text: '🔔 Подписаться на обновления', web_app: { url: webAppUrl } }
  ]);
  keyboard.push([
    { text: '📊 Мои подписки', callback_data: 'my_subscriptions' },
    { text: '❓ Помощь', callback_data: 'show_help' }
  ]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

// Создание клавиатуры с вакансиями по категориям
export function createVacancyKeyboard(vacancies) {
  const keyboard = [];
  
  // Группируем вакансии по категориям
  const categories = groupVacanciesByCategory(vacancies);
  
  // Если нет вакансий, возвращаем пустое меню
  if (Object.keys(categories).length === 0) {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📝 Отправить резюме', callback_data: 'send_resume' }]
        ]
      }
    };
  }
  
  // Создаем кнопки категорий
  for (const [category, categoryVacancies] of Object.entries(categories)) {
    keyboard.push([{
      text: `${category} (${categoryVacancies.length})`,
      callback_data: `category_${category.toLowerCase().replace(/\s+/g, '_')}`
    }]);
  }
  
  // Добавляем кнопки навигации
  keyboard.push([
    { text: '🔄 Изменить отклик', callback_data: 'change_response' },
    { text: '📋 Все вакансии', callback_data: 'show_all_vacancies' }
  ]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

// Группировка вакансий по категориям
export function groupVacanciesByCategory(vacancies) {
  if (!vacancies || !Array.isArray(vacancies)) {
    return {};
  }
  
  const categories = {};
  
  vacancies.forEach(vacancy => {
    const category = vacancy.category || 'Другие';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(vacancy);
  });
  
  return categories;
}

// Создание клавиатуры для конкретной категории
export function createCategoryKeyboard(categoryVacancies, categoryName) {
  const keyboard = [];
  
  // Создаем ряды по 2 кнопки
  for (let i = 0; i < categoryVacancies.length; i += 2) {
    const row = [];
    
    // Первая кнопка в ряду
    row.push({
      text: `${categoryVacancies[i].emoji} ${categoryVacancies[i].title}`,
      callback_data: `vacancy_${categoryVacancies[i].id}`
    });
    
    // Вторая кнопка в ряду (если есть)
    if (i + 1 < categoryVacancies.length) {
      row.push({
        text: `${categoryVacancies[i + 1].emoji} ${categoryVacancies[i + 1].title}`,
        callback_data: `vacancy_${categoryVacancies[i + 1].id}`
      });
    }
    
    keyboard.push(row);
  }
  
  // Добавляем кнопку "Назад"
  keyboard.push([
    { text: '⬅️ Назад к категориям', callback_data: 'back_to_categories' }
  ]);
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

// Создание уникального URL для Telegraph-страницы
export function createTelegraphUrl(vacancy) {
  // Создаем уникальный URL на основе ID вакансии
  const baseUrl = 'https://telegra.ph';
  const pageId = `vacancy-${vacancy.id.replace('vacancy_', '')}`;
  return `${baseUrl}/${pageId}`;
}

// Создание контента для Telegraph-страницы
export function createTelegraphContent(vacancy, vacancies) {
  const requirements = getRequirementsByCategory(vacancy.category, vacancies);
  const benefits = getBenefitsByCategory(vacancy.category, vacancies);
  
  return [
    {
      tag: 'h3',
      children: [`${vacancy.emoji} ${vacancy.title}`]
    },
    {
      tag: 'p',
      children: [vacancy.description]
    },
    {
      tag: 'h4',
      children: ['📋 Требования:']
    },
    {
      tag: 'ul',
      children: requirements.map(req => ({ tag: 'li', children: [req] }))
    },
    {
      tag: 'h4',
      children: ['💰 Условия:']
    },
    {
      tag: 'ul',
      children: [
        { tag: 'li', children: [`Зарплата: ${vacancy.salary || 'По договоренности'}`] },
        { tag: 'li', children: [`Уровень: ${vacancy.level || 'Любой'}`] },
        ...benefits.map(benefit => ({ tag: 'li', children: [benefit] }))
      ]
    },
    {
      tag: 'h4',
      children: ['📞 Как подать заявку:']
    },
    {
      tag: 'ol',
      children: [
        { tag: 'li', children: ['Нажмите кнопку "Выбрать эту вакансию"'] },
        { tag: 'li', children: ['Прикрепите файл резюме (PDF, DOC, DOCX)'] },
        { tag: 'li', children: ['Дождитесь подтверждения отправки'] }
      ]
    },
    {
      tag: 'p',
      children: ['💡 **Совет:** Убедитесь, что ваше резюме актуально и содержит релевантный опыт работы.']
    }
  ];
}

// Получение требований по категории (из Google Sheets)
function getRequirementsByCategory(category, vacancies) {
  console.log('🔍 getRequirementsByCategory - category:', category);
  console.log('🔍 getRequirementsByCategory - vacancies type:', typeof vacancies);
  console.log('🔍 getRequirementsByCategory - vacancies isArray:', Array.isArray(vacancies));
  
  // Проверяем, что vacancies существует и является массивом
  if (!vacancies || !Array.isArray(vacancies)) {
    console.log('❌ getRequirementsByCategory - vacancies is invalid, returning empty array');
    return [];
  }
  
  // Ищем вакансию в этой категории для получения требований
  const categoryVacancies = vacancies.filter(v => v.category === category);
  if (categoryVacancies.length > 0) {
    // Берем требования из первой вакансии категории (если есть поле requirements)
    const vacancy = categoryVacancies[0];
    if (vacancy.requirements && vacancy.requirements.trim()) {
      return vacancy.requirements.split('\n').filter(req => req.trim());
    }
  }
  
  // Если нет требований в таблице, возвращаем пустой массив
  return [];
}

// Получение преимуществ по категории (из Google Sheets)
function getBenefitsByCategory(category, vacancies) {
  // Проверяем, что vacancies существует и является массивом
  if (!vacancies || !Array.isArray(vacancies)) {
    return [];
  }
  
  // Ищем вакансию в этой категории для получения преимуществ
  const categoryVacancies = vacancies.filter(v => v.category === category);
  if (categoryVacancies.length > 0) {
    // Берем преимущества из первой вакансии категории (если есть поле benefits)
    const vacancy = categoryVacancies[0];
    if (vacancy.benefits && vacancy.benefits.trim()) {
      return vacancy.benefits.split('\n').filter(benefit => benefit.trim());
    }
  }
  
  // Если нет преимуществ в таблице, возвращаем пустой массив
  return [];
}

// Создание клавиатуры для выбранной вакансии
export function createVacancyDetailKeyboard(vacancy, isDetailed = false) {
  const keyboard = [
    [
      { 
        text: '📝 Откликнуться на вакансию', 
        callback_data: `apply_${vacancy.id}` 
      }
    ],
    [
      { 
        text: isDetailed ? '📋 Краткое описание' : '📖 Подробное описание', 
        callback_data: isDetailed ? `brief_${vacancy.id}` : `detail_${vacancy.id}` 
      }
    ],
    [
      { text: '⬅️ Назад', callback_data: `back_to_category_${vacancy.category}` }
    ]
  ];
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

// Получение вакансии по ID
export function getVacancyById(vacancies, id) {
  if (!vacancies || !Array.isArray(vacancies)) {
    return null;
  }
  return vacancies.find(vacancy => vacancy.id === id);
}

// Создание подробного описания вакансии
export function createDetailedVacancyMessage(vacancy, vacancies) {
  // Проверяем, что vacancy существует
  if (!vacancy) {
    return '❌ Вакансия не найдена';
  }
  
  const requirements = getRequirementsByCategory(vacancy.category, vacancies);
  const benefits = getBenefitsByCategory(vacancy.category, vacancies);
  
  let message = `📋 **${vacancy.emoji || '💼'} ${vacancy.title || 'Вакансия'}**\n\n`;
  message += `📝 **Описание:**\n${vacancy.description || 'Описание не указано'}\n\n`;
  
  if (vacancy.level && vacancy.level.trim()) {
    message += `📊 **Уровень:** ${vacancy.level}\n`;
  }
  if (vacancy.salary && vacancy.salary.trim()) {
    message += `💰 **Зарплата:** ${vacancy.salary}\n`;
  }
  
  if (requirements.length > 0) {
    message += `\n📋 **Требования:**\n`;
    requirements.forEach((req, index) => {
      message += `${index + 1}. ${req}\n`;
    });
  }
  
  if (benefits.length > 0) {
    message += `\n💰 **Условия:**\n`;
    benefits.forEach(benefit => {
      message += `• ${benefit}\n`;
    });
  }
  
  message += `\n\n💡 **Хотите откликнуться?**\n`;
  message += `1. Нажмите "📝 Откликнуться"\n`;
  message += `2. Отправьте ваше резюме (PDF/DOC/DOCX/TXT)\n`;
  message += `3. Готово! ✅`;
  
  return message;
}

// Создание клавиатуры после выбора вакансии
export function createAfterSelectionKeyboard(vacancy = null) {
  const keyboard = [
    [
      { text: '🔄 Изменить вакансию', callback_data: 'change_vacancy' },
      { text: '📋 Список вакансий', callback_data: 'show_vacancies' }
    ],
    [
      { text: '❌ Отменить отклик', callback_data: 'cancel_response' }
    ]
  ];
  
  // Добавляем предложение подписки на категорию
  if (vacancy && vacancy.category) {
    keyboard.splice(1, 0, [
      { 
        text: `🔔 Подписаться на "${vacancy.category}"`, 
        callback_data: `subscribe_category_${vacancy.category.toLowerCase().replace(/\s+/g, '_')}` 
      }
    ]);
  }
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

// Создание клавиатуры для отмены
export function createCancelKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Да, отменить', callback_data: 'confirm_cancel' },
          { text: '❌ Нет, продолжить', callback_data: 'keep_response' }
        ]
      ]
    }
  };
}
