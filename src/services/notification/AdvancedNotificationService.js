import { findMatchingVacancies, getUserTags, getVacancyTags } from '../supabase/matchingService.js';
import { getVacancyById } from '../supabase/supabaseVacancies.js';
import { telegramNotifications } from '../telegram-notifications.js';
import { supabase } from '../supabase/supabase.js';

/**
 * Сервис персонализированных уведомлений
 * Алгоритм:
 * 1. Получить всех активных пользователей с подписками
 * 2. Для каждого найти подходящие вакансии (по тегам)
 * 3. Отправить только те вакансии которые еще не отправляли
 * 4. Записать факт отправки в notifications
 */
export class AdvancedNotificationService {
  constructor() {
    this.name = 'AdvancedNotificationService';
  }

  async sendPersonalizedNotifications() {
    try {
      const users = await this.getUsersWithPreferences();
      
      if (users.length === 0) {
        return { success: true, sent: 0 };
      }

      let totalSent = 0;
      let totalErrors = 0;

      for (const user of users) {
        try {
          const sent = await this.sendNotificationsToUser(user);
          totalSent += sent;
        } catch (error) {
          console.error(`Ошибка отправки уведомлений пользователю ${user.user_id}:`, error.message);
          totalErrors++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (totalSent > 0) {
        console.log(` Отправлено ${totalSent} уведомлений (обработано ${users.length} пользователей)`);
      }
      
      return { 
        success: true, 
        sent: totalSent, 
        errors: totalErrors,
        users_processed: users.length 
      };
    } catch (error) {
      console.error('Ошибка отправки уведомлений:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getUsersWithPreferences() {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('user_id, username, first_name, preferences')
        .eq('is_active', true);

      if (error) {
        console.error('Ошибка получения пользователей:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Ошибка получения пользователей:', error.message);
      return [];
    }
  }

  async sendNotificationsToUser(user) {
    try {
      const matchingVacancies = await findMatchingVacancies(user.user_id);
      
      if (matchingVacancies.length === 0) {
        return 0;
      }

      let sentCount = 0;

      for (const vacancy of matchingVacancies) {
        try {
          await this.sendPersonalizedVacancyNotification(
            user, 
            vacancy, 
            vacancy.matchCount,
            vacancy.matchedTags
          );
          
          await this.recordNotificationSent(user.user_id, vacancy.id);
          sentCount++;
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          if (error.response?.error_code === 403) {
            await this.deactivateUserSubscription(user.user_id);
            break;
          }
        }
      }

      return sentCount;
    } catch (error) {
      console.error(`Ошибка обработки пользователя ${user.user_id}:`, error.message);
      return 0;
    }
  }

  async sendPersonalizedVacancyNotification(user, vacancy, matchCount, matchedTags) {
    const message = this.createPersonalizedMessage(user, vacancy, matchCount, matchedTags);
    
    await telegramNotifications.sendMessage(user.user_id, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{
            text: ' Посмотреть детали',
            callback_data: `detail_${vacancy.id}`
          }],
          [{
            text: ' Откликнуться',
            callback_data: `apply_${vacancy.id}`
          }],
          [{
            text: ' Мои подписки',
            callback_data: 'my_subscriptions'
          }]
        ]
      }
    });
  }

  createPersonalizedMessage(user, vacancy, matchCount, matchedTags) {
    const userName = user.first_name || user.username || 'Коллега';
    
    let message = ` *${userName}, для вас найдена подходящая вакансия\\!*\n\n`;
    
    message += `� *${this.escapeMarkdown(vacancy.title)}*\n`;
    message += ` ${this.escapeMarkdown(vacancy.category || 'Не указано')}\n\n`;
    
    if (vacancy.salary) {
      message += ` ${this.escapeMarkdown(vacancy.salary)}\n`;
    }
    
    if (vacancy.work_type) {
      message += `� ${this.escapeMarkdown(vacancy.work_type)}\n`;
    }
    
    if (vacancy.location) {
      message += `� ${this.escapeMarkdown(vacancy.location)}\n`;
    }
    
    // Краткое описание (первые 200 символов)
    if (vacancy.description) {
      const shortDesc = vacancy.description.substring(0, 200);
      message += `\n ${this.escapeMarkdown(shortDesc)}${vacancy.description.length > 200 ? '...' : ''}\n`;
    }
    
    // Показываем совпадающие теги
    if (matchedTags && matchedTags.length > 0) {
      const tags = matchedTags.slice(0, 5).map(t => this.escapeMarkdown(t)).join(', ');
      message += `\n� *Совпадения:* ${tags} \\(${matchCount}\\)\n`;
    }
    
    message += `\n _Вакансия подобрана по вашим предпочтениям_`;
    
    return message;
  }

  // Экранирование специальных символов для Markdown v2
  escapeMarkdown(text) {
    if (!text) return '';
    return String(text)
      .replace(/\_/g, '\\_')
      .replace(/\*/g, '\\*')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\~/g, '\\~')
      .replace(/\`/g, '\\`')
      .replace(/\>/g, '\\>')
      .replace(/\#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/\-/g, '\\-')
      .replace(/\=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/\!/g, '\\!');
  }

  async deactivateUserSubscription(userId) {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (!error) {
        console.log(`Подписка пользователя ${userId} деактивирована`);
      }

      return !error;
    } catch (error) {
      return false;
    }
  }

  async recordNotificationSent(userId, vacancyId) {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          vacancy_id: vacancyId,
          status: 'sent',
          sent_at: new Date().toISOString()
        });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getNotificationStats() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('status, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // За последние 24 часа

      if (error) {
        console.error('Ошибка получения статистики уведомлений:', error);
        return null;
      }

      const stats = {
        total: data.length,
        sent: data.filter(n => n.status === 'sent').length,
        failed: data.filter(n => n.status === 'failed').length,
        pending: data.filter(n => n.status === 'pending').length
      };

      return stats;
    } catch (error) {
      console.error('Ошибка получения статистики уведомлений:', error);
      return null;
    }
  }
}

export const advancedNotificationService = new AdvancedNotificationService();

