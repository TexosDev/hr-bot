import { findMatchingUsers } from '../supabase/supabaseUserPreferences.js';
import { getVacancyByIdFromSupabase } from '../supabase/supabaseVacancies.js';
import { telegramNotifications } from '../telegram-notifications.js';

/**
 * Сервис уведомлений для новой системы подписок
 * Следует принципам SOLID, DRY, KISS
 */

/**
 * Отправка уведомлений о новой вакансии
 * SOLID: Единственная ответственность
 */
export async function notifyUsersAboutNewVacancy(vacancyId) {
  try {
    console.log(` Отправка уведомлений о новой вакансии ${vacancyId}...`);
    
    // Получаем данные вакансии
    const vacancy = await getVacancyByIdFromSupabase(vacancyId);
    if (!vacancy) {
      console.error(` Вакансия ${vacancyId} не найдена`);
      return { success: false, error: 'Вакансия не найдена' };
    }
    
    // Находим подходящих пользователей
    const matchingUsers = await findMatchingUsers(vacancyId);
    
    if (matchingUsers.length === 0) {
      console.log(` Нет подходящих пользователей для вакансии: ${vacancy.title}`);
      return { success: true, notified: 0 };
    }
    
    console.log(`� Найдено ${matchingUsers.length} подходящих пользователей`);
    
    // Создаем сообщение
    const message = createVacancyNotificationMessage(vacancy);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Отправляем уведомления
    for (const user of matchingUsers) {
      try {
        await sendNotificationToUser(user.user_id, message, vacancyId);
        successCount++;
        console.log(` Уведомление отправлено пользователю: ${user.user_id}`);
      } catch (error) {
        errorCount++;
        console.error(` Ошибка отправки уведомления пользователю ${user.user_id}:`, error);
        
        // Если пользователь заблокировал бота, деактивируем подписку
        if (error.response?.error_code === 403) {
          console.log(`� Деактивируем подписку заблокированного пользователя: ${user.user_id}`);
          await deactivateUserSubscription(user.user_id);
        }
      }
    }
    
    console.log(` Уведомления отправлены: ${successCount} успешно, ${errorCount} с ошибками`);
    
    return {
      success: true,
      notified: successCount,
      errors: errorCount
    };
    
  } catch (error) {
    console.error(' Ошибка отправки уведомлений:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Создание сообщения о новой вакансии
 * DRY: Переиспользуемая логика форматирования
 */
function createVacancyNotificationMessage(vacancy) {
  let message = ` **Новая вакансия!**\n\n`;
  message += ` **${vacancy.emoji} ${vacancy.title}**\n\n`;
  
  if (vacancy.description) {
    message += ` ${vacancy.description}\n\n`;
  }
  
  message += ` **Детали:**\n`;
  message += `• Категория: ${vacancy.category}\n`;
  message += `• Уровень: ${vacancy.level || 'Любой'}\n`;
  message += `• Зарплата: ${vacancy.salary || 'По договоренности'}\n`;
  
  if (vacancy.work_type && vacancy.work_type !== 'Любой') {
    message += `• Формат: ${vacancy.work_type}\n`;
  }
  
  if (vacancy.location && vacancy.location !== 'Не указано') {
    message += `• Локация: ${vacancy.location}\n`;
  }
  
  if (vacancy.tags && vacancy.tags.length > 0) {
    message += `• Технологии: ${vacancy.tags.join(', ')}\n`;
  }
  
  message += `\n **Хотите подать отклик?**\n`;
  message += `Нажмите /start для начала работы с ботом`;
  
  return message;
}

/**
 * Отправка уведомления пользователю
 * KISS: Простая логика отправки
 */
async function sendNotificationToUser(userId, message, vacancyId) {
  try {
    // Здесь должна быть логика отправки через бота
    // Пока используем заглушку
    console.log(` Отправка уведомления пользователю ${userId}: ${message.substring(0, 100)}...`);
    
    // TODO: Интегрировать с реальным ботом
    // await bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' });
    
    return true;
  } catch (error) {
    console.error(` Ошибка отправки уведомления пользователю ${userId}:`, error);
    throw error;
  }
}

/**
 * Массовая отправка уведомлений
 * SOLID: Отдельная ответственность для массовых операций
 */
export async function sendBulkNotifications(vacancyIds) {
  try {
    console.log(`� Массовая отправка уведомлений для ${vacancyIds.length} вакансий...`);
    
    const results = [];
    
    for (const vacancyId of vacancyIds) {
      const result = await notifyUsersAboutNewVacancy(vacancyId);
      results.push({ vacancyId, ...result });
    }
    
    const totalNotified = results.reduce((sum, r) => sum + (r.notified || 0), 0);
    const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);
    
    console.log(` Массовая отправка завершена: ${totalNotified} уведомлений, ${totalErrors} ошибок`);
    
    return {
      success: true,
      totalNotified,
      totalErrors,
      results
    };
    
  } catch (error) {
    console.error(' Ошибка массовой отправки уведомлений:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Получение статистики уведомлений
 * SOLID: Отдельная ответственность для аналитики
 */
export async function getNotificationStats() {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('status, sent_at')
      .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // За последнюю неделю
    
    if (error) {
      console.error(' Ошибка получения статистики уведомлений:', error);
      return null;
    }
    
    const stats = {
      total: data.length,
      sent: data.filter(n => n.status === 'sent').length,
      delivered: data.filter(n => n.status === 'delivered').length,
      failed: data.filter(n => n.status === 'failed').length,
      blocked: data.filter(n => n.status === 'blocked').length
    };
    
    return stats;
  } catch (error) {
    console.error(' Ошибка получения статистики уведомлений:', error);
    return null;
  }
}
