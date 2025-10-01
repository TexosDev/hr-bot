import { BaseCommand } from './BaseCommand.js';
import { getUserPreferences } from '../services/supabase/supabaseUserPreferences.js';

/**
 * Команда для просмотра подписок пользователя
 * Проверяет в БД и показывает либо подписку, либо предложение подписаться
 */
export class MySubscriptionsCommand extends BaseCommand {
  constructor() {
    super('my_subscriptions', ' Мои подписки');
  }

  async execute(ctx) {
    const userId = ctx.from?.id;
    
    if (!userId) {
      await ctx.reply(' Ошибка получения ID пользователя');
      return;
    }

    try {
      const preferences = await getUserPreferences(userId);
      
      if (!preferences) {
        await this.showNoSubscriptionMessage(ctx);
        return;
      }

      const message = this.createPreferencesMessage(preferences);
      const keyboard = this.createPreferencesKeyboard();
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
    } catch (error) {
      await this.handleError(ctx, error, 'показа подписок');
    }
  }

  async showNoSubscriptionMessage(ctx) {
    const webAppUrl = process.env.WEBAPP_URL || `http://localhost:3001/webapp/index.html`;
    
    await ctx.reply(
      '� *У вас нет активной подписки*\n\n' +
      'Для получения персонализированных уведомлений о вакансиях заполните профиль\\.\n\n' +
      ' Система будет сопоставлять ваши предпочтения с тегами вакансий и отправлять релевантные уведомления\\.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: ' Подписаться на обновления', web_app: { url: webAppUrl } }],
            [{ text: ' Посмотреть вакансии', callback_data: 'show_vacancies' }],
            [{ text: ' Главное меню', callback_data: 'back_to_main' }]
          ]
        }
      }
    );
  }

  createPreferencesMessage(preferences) {
    const prefs = preferences.preferences;
    const createdAt = new Date(preferences.created_at).toLocaleDateString('ru-RU');
    
    let message = ' *Ваша подписка на вакансии*\n\n';
    
    if (prefs.specialization && prefs.specialization.length > 0) {
      message += ` *Направления:* ${prefs.specialization.join(', ')}\n`;
    }
    
    if (prefs.technologies && prefs.technologies.length > 0) {
      message += ` *Технологии:* ${prefs.technologies.join(', ')}\n`;
    }
    
    if (prefs.experience && prefs.experience.length > 0) {
      message += `� *Опыт:* ${prefs.experience.join(', ')}\n`;
    }
    
    if (prefs.work_format && prefs.work_format.length > 0) {
      message += ` *Формат работы:* ${prefs.work_format.join(', ')}\n`;
    }
    
    message += `\n� *Подписка с:* ${createdAt}\n`;
    message += ` *Статус:* Активна\n\n`;
    message += ` *Как это работает:*\n`;
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
          [{ text: ' Изменить предпочтения', web_app: { url: webAppUrl } }],
          [{ text: ' Посмотреть вакансии', callback_data: 'show_vacancies' }],
          [{ text: ' Главное меню', callback_data: 'back_to_main' }]
        ]
      }
    };
  }
}

