// Конфигурация и константы
export const CONFIG = {
  // Лимиты
  MAX_TEXT_PREVIEW: 4000,
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  
  // Google Sheets
  RESPONSES_SHEET_RANGE: 'A:L',
  
  // Группа для резюме
  RESUME_GROUP_ID: process.env.RESUME_GROUP_ID || null,
  
  // Сообщения
  MESSAGES: {
    WELCOME: 'Привет! Пришлите, пожалуйста, резюме (PDF/DOC/DOCX/TXT).\nМы ответим вам после первичного просмотра. 🙂',
    HELP: '👋 *Я помогу найти вакансию мечты!*\n\n📋 *Доступные команды:*\n\n🚀 /start - начать работу с ботом\n💼 /vacancies - посмотреть все вакансии\n🔔 /subscribe - подписаться на уведомления\n📊 /my\\_subscriptions - мои подписки\n🌐 /webapp - открыть форму\n🔄 /reset - сбросить сессию\n❓ /help - эта справка\n\n💡 *Как откликнуться:*\n1\\. Выберите вакансию\n2\\. Нажмите "Откликнуться"\n3\\. Отправьте резюме\n\n🎯 *Подписка на уведомления:*\nПройдите опрос и получайте персонализированные уведомления о подходящих вакансиях\\!',
    SUCCESS: 'Спасибо! Резюме получено и сохранено 👌 Мы свяжемся с вами в ближайшее время.',
    ERROR: 'Не удалось обработать файл. Попробуйте ещё раз, пожалуйста. Поддерживаемые форматы: PDF, DOCX, TXT.',
    ADMIN_NOTIFICATION: (user, email, phone, fileName, telegramLink, vacancyTitle, textPreview) => 
      `📝 Новая заявка\n` +
      `• Пользователь: @${user.username || '—'} (${user.id})\n` +
      (email ? `• Email: ${email}\n` : '') +
      (phone ? `• Тел: ${phone}\n` : '') +
      (fileName ? `• Файл: ${fileName}\n` : '') +
      (vacancyTitle ? `• Вакансия: ${vacancyTitle}\n` : '') +
      (telegramLink ? `🔗 Резюме в Telegram: ${telegramLink}\n` : '') +
      (textPreview ? `\n📄 Сопоставленный текст:\n${textPreview}` : ''),
    
    // Сообщения для подписок
    SUBSCRIPTION_SUBSCRIBED: (category) => `✅ Подписка активна!\n\n🔔 Теперь вы будете получать уведомления о новых вакансиях в категории: **${category}**`,
    SUBSCRIPTION_UNSUBSCRIBED: (category) => `❌ Подписка отменена\n\n🔕 Вы больше не будете получать уведомления о вакансиях в категории: **${category}**`,
    SUBSCRIPTION_ALREADY_SUBSCRIBED: (category) => `⚠️ Вы уже подписаны на категорию: **${category}**`,
    SUBSCRIPTION_NOT_FOUND: (category) => `❌ Подписка на категорию **${category}** не найдена`,
    NEW_VACANCY_NOTIFICATION: (vacancy) => `🔔 **Новая вакансия!**\n\n📋 **${vacancy.emoji} ${vacancy.title}**\n\n📝 ${vacancy.description}\n\n📊 Уровень: ${vacancy.level || 'Любой'}\n💰 Зарплата: ${vacancy.salary || 'По договоренности'}\n\n🎯 Хотите подать отклик? Нажмите /start`,
    
    // Сообщение для группы с резюме
    GROUP_RESUME_MESSAGE: (user, vacancyTitle, fileName, textPreview) => {
      const hashtags = vacancyTitle && vacancyTitle !== 'Общее резюме' 
        ? `#${vacancyTitle.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '').replace(/\s+/g, '_')}`
        : '#Резюме';
      
      // Экранируем специальные символы для HTML
      const escapeHtml = (text) => {
        return text.replace(/[<>&"]/g, (match) => {
          switch (match) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            default: return match;
          }
        });
      };
      
      const safeTextPreview = escapeHtml(textPreview.substring(0, 500));
      const safeFileName = escapeHtml(fileName);
      const safeVacancyTitle = escapeHtml(vacancyTitle);
      const safeUsername = user.username ? escapeHtml(user.username) : 'без_username';
      const safeFirstName = user.first_name ? escapeHtml(user.first_name) : 'Имя не указано';
      
      return `📝 <b>Новое резюме</b>\n\n` +
        `👤 <b>Кандидат:</b> @${safeUsername} (${safeFirstName})\n` +
        `📋 <b>Вакансия:</b> ${safeVacancyTitle}\n` +
        `📄 <b>Файл:</b> ${safeFileName}\n\n` +
        `📝 <b>Описание:</b>\n${safeTextPreview}${textPreview.length > 500 ? '...' : ''}\n\n` +
        `${hashtags} #HR #Работа`;
    }
  },
  
  // Поддерживаемые форматы
  SUPPORTED_FORMATS: {
    PDF: ['application/pdf', '.pdf'],
    DOCX: ['.docx'],
    TXT: ['text/plain', '.txt']
  }
};
