import { BaseAction } from './BaseAction.js';
import { getVacanciesFromSupabase } from '../services/supabase/supabaseVacancies.js';
import { createMainMenuKeyboard, createCategoryKeyboard, groupVacanciesByCategory } from '../services/vacancies.js';
import { getSelectedVacancy, setSelectedVacancy, clearSession } from '../utils/session.js';

/**
 * Действия для навигации
 * Следует принципам SOLID, DRY, KISS
 */

/**
 * Показ всех вакансий
 */
export class ShowVacanciesAction extends BaseAction {
  constructor() {
    super('show_vacancies');
  }

  async execute(ctx) {
    try {
      const vacancies = await getVacanciesFromSupabase();
      const keyboard = createMainMenuKeyboard(vacancies);
      
      await ctx.editMessageText(
        '👋 Добро пожаловать!\n\nВыберите категорию вакансий:',
        {
          reply_markup: keyboard.reply_markup
        }
      );
      
      await this.answerCallback(ctx, 'Показаны категории вакансий');
    } catch (error) {
      await this.handleError(ctx, error, 'показа вакансий');
    }
  }
}

/**
 * Показ всех вакансий (список)
 */
export class ShowAllVacanciesAction extends BaseAction {
  constructor() {
    super('show_all_vacancies');
  }

  async execute(ctx) {
    try {
      const vacancies = await getVacanciesFromSupabase();
      const groupedVacancies = groupVacanciesByCategory(vacancies);
      
      let message = '📋 **Все вакансии**\n\n';
      
      for (const [category, categoryVacancies] of Object.entries(groupedVacancies)) {
        message += `**${category}**\n`;
        for (const vacancy of categoryVacancies) {
          message += `• ${vacancy.emoji} ${vacancy.title}\n`;
        }
        message += '\n';
      }
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад к категориям', callback_data: 'back_to_categories' }]
          ]
        }
      });
      
      await this.answerCallback(ctx, 'Показаны все вакансии');
    } catch (error) {
      await this.handleError(ctx, error, 'показа всех вакансий');
    }
  }
}

/**
 * Возврат к главному меню
 */
export class BackToMainAction extends BaseAction {
  constructor() {
    super('back_to_main');
  }

  async execute(ctx) {
    try {
      const vacancies = await getVacanciesFromSupabase();
      const keyboard = createMainMenuKeyboard(vacancies);
      
      await ctx.editMessageText(
        '👋 Добро пожаловать!\n\nВыберите категорию вакансий:',
        {
          reply_markup: keyboard.reply_markup
        }
      );
      
      await this.answerCallback(ctx, 'Возврат к главному меню');
    } catch (error) {
      await this.handleError(ctx, error, 'возврата к главному меню');
    }
  }
}

/**
 * Изменение вакансии
 */
export class ChangeVacancyAction extends BaseAction {
  constructor() {
    super('change_vacancy');
  }

  async execute(ctx) {
    try {
      const vacancies = await getVacanciesFromSupabase();
      const keyboard = createMainMenuKeyboard(vacancies);
      
      await ctx.editMessageText(
        '🔄 **Изменение вакансии**\n\nВыберите новую категорию:',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        }
      );
      
      await this.answerCallback(ctx, 'Выбор новой вакансии');
    } catch (error) {
      await this.handleError(ctx, error, 'изменения вакансии');
    }
  }
}

/**
 * Отправка резюме
 */
export class SendResumeAction extends BaseAction {
  constructor() {
    super('send_resume');
  }

  async execute(ctx) {
    try {
      await ctx.editMessageText(
        '📝 **Отправка резюме**\n\n' +
        'Пришлите ваше резюме в виде файла (PDF, DOC, DOCX, TXT).\n\n' +
        'Мы рассмотрим ваше резюме и свяжемся с вами, если появится подходящая вакансия.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⬅️ Назад', callback_data: 'back_to_main' }]
            ]
          }
        }
      );
      
      await this.answerCallback(ctx, 'Готов к получению резюме');
    } catch (error) {
      await this.handleError(ctx, error, 'отправки резюме');
    }
  }
}

/**
 * Показ справки
 */
export class ShowHelpAction extends BaseAction {
  constructor() {
    super('show_help');
  }

  async execute(ctx) {
    try {
      const { CONFIG } = await import('../config/constants.js');
      const webAppUrl = process.env.WEBAPP_URL || `http://localhost:3001/webapp/index.html`;
      
      await ctx.editMessageText(CONFIG.MESSAGES.HELP, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Начать', callback_data: 'back_to_main' }],
            [{ text: '📋 Вакансии', callback_data: 'show_vacancies' }],
            [{ text: '🔔 Подписаться на обновления', web_app: { url: webAppUrl } }],
            [{ text: '📊 Мои подписки', callback_data: 'my_subscriptions' }]
          ]
        }
      });
      
      await this.answerCallback(ctx, 'Справка по командам');
    } catch (error) {
      await this.handleError(ctx, error, 'показа справки');
    }
  }
}

/**
 * Показ подписок пользователя (callback)
 */
export class MySubscriptionsAction extends BaseAction {
  constructor() {
    super('my_subscriptions');
  }

  async execute(ctx) {
    const userId = ctx.from?.id;
    
    if (!userId) {
      await this.answerCallback(ctx, '❌ Ошибка получения ID пользователя');
      return;
    }

    try {
      const { getUserPreferences } = await import('../services/supabase/supabaseUserPreferences.js');
      const preferences = await getUserPreferences(userId);
      
      if (!preferences) {
        await this.showNoSubscriptionMessage(ctx);
        return;
      }

      const message = this.createPreferencesMessage(preferences);
      const keyboard = this.createPreferencesKeyboard();
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      
      await this.answerCallback(ctx, 'Показаны ваши подписки');
    } catch (error) {
      await this.handleError(ctx, error, 'показа подписок');
    }
  }

  async showNoSubscriptionMessage(ctx) {
    const webAppUrl = process.env.WEBAPP_URL || `http://localhost:3001/webapp/index.html`;
    
    await ctx.editMessageText(
      '🔕 **У вас нет активной подписки**\n\n' +
      'Для получения персонализированных уведомлений о вакансиях заполните профиль\\.\n\n' +
      '💡 Система будет сопоставлять ваши предпочтения с тегами вакансий и отправлять релевантные уведомления\\.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔔 Подписаться на обновления', web_app: { url: webAppUrl } }],
            [{ text: '📋 Посмотреть вакансии', callback_data: 'show_vacancies' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_to_main' }]
          ]
        }
      }
    );
  }

  createPreferencesMessage(preferences) {
    const prefs = preferences.preferences;
    const createdAt = new Date(preferences.created_at).toLocaleDateString('ru-RU');
    
    let message = '🔔 *Ваша подписка на вакансии*\n\n';
    
    if (prefs.specialization && prefs.specialization.length > 0) {
      message += `🎯 *Направления:* ${prefs.specialization.join(', ')}\n`;
    }
    
    if (prefs.technologies && prefs.technologies.length > 0) {
      message += `💻 *Технологии:* ${prefs.technologies.join(', ')}\n`;
    }
    
    if (prefs.experience && prefs.experience.length > 0) {
      message += `📈 *Опыт:* ${prefs.experience.join(', ')}\n`;
    }
    
    if (prefs.work_format && prefs.work_format.length > 0) {
      message += `🏢 *Формат работы:* ${prefs.work_format.join(', ')}\n`;
    }
    
    message += `\n📅 *Подписка с:* ${createdAt}\n`;
    message += `🔔 *Статус:* Активна\n\n`;
    message += `💡 *Как это работает:*\n`;
    message += `• Вы получаете уведомления о подходящих вакансиях\n`;
    message += `• Система сопоставляет ваши предпочтения с требованиями\n`;
    message += `• Каждые 2 часа проверяются новые вакансии`;
    
    return message;
  }

  createPreferencesKeyboard() {
    const webAppUrl = process.env.WEBAPP_URL || `http://localhost:3001/webapp/index.html`;
    
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Изменить предпочтения', web_app: { url: webAppUrl } }],
          [{ text: '📋 Посмотреть вакансии', callback_data: 'show_vacancies' }],
          [{ text: '🏠 Главное меню', callback_data: 'back_to_main' }]
        ]
      }
    };
  }
}