import cron from 'node-cron';
import { fullSync } from './supabase/syncSheetsSupabase.js';
import { syncSurveyQuestions } from './supabase/syncSurveyQuestions.js';
import { notifyAdmin } from './telegram-notifications.js';
import { advancedNotificationService } from './notification/AdvancedNotificationService.js';

class SyncScheduler {
  constructor() {
    this.isRunning = false;
    this.jobs = [];
  }

  start() {
    if (this.isRunning) {
      return;
    }

    const frequentSync = cron.schedule('*/30 * * * *', async () => {
      await this.performSync('автоматическая');
    });

    const dailySync = cron.schedule('0 9 * * *', async () => {
      await this.performSync('утренняя');
    });

    const eveningSync = cron.schedule('0 18 * * *', async () => {
      await this.performSync('вечерняя');
    });

    const personalizedNotifications = cron.schedule('0 */2 * * *', async () => {
      await this.sendPersonalizedNotifications();
    });

    const questionsSync = cron.schedule('0 * * * *', async () => {
      await this.syncQuestions();
    });

    this.jobs = [frequentSync, dailySync, eveningSync, personalizedNotifications, questionsSync];
    this.isRunning = true;

    console.log('✅ Scheduler started');
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Выполнение синхронизации с уведомлениями
   * SOLID: Единственная ответственность
   */
  async performSync(type) {
    try {
      const result = await fullSync();
      
      if (result.success) {
        const message = this.formatSuccessMessage(result, type);
        console.log(message);
        
        // Уведомляем админа только если есть изменения
        if (this.hasChanges(result)) {
          await notifyAdmin(message);
        }
      } else {
        const errorMessage = `❌ Ошибка ${type} синхронизации: ${result.error}`;
        console.error(errorMessage);
        await notifyAdmin(errorMessage);
      }
    } catch (error) {
      const errorMessage = `❌ Критическая ошибка ${type} синхронизации: ${error.message}`;
      console.error(errorMessage);
      await notifyAdmin(errorMessage);
    }
  }

  /**
   * Форматирование сообщения об успехе
   * DRY: Переиспользуемая логика форматирования
   */
  formatSuccessMessage(result, type) {
    const vacancies = result.vacancies || {};
    const subscriptions = result.subscriptions || {};
    
    return `🔄 ${type} синхронизация завершена!\n\n` +
           `📊 Результаты:\n` +
           `• Вакансии: ${vacancies.synced || 0} новых, ${vacancies.updated || 0} обновленных\n` +
           `• Подписки: ${subscriptions.synced || 0} синхронизированных\n\n` +
           `⏰ ${new Date().toLocaleString('ru-RU')}`;
  }

  /**
   * Проверка наличия изменений
   * KISS: Простая логика проверки
   */
  hasChanges(result) {
    const vacancies = result.vacancies || {};
    
    return (vacancies.synced > 0 || vacancies.updated > 0);
  }

  /**
   * Ручной запуск синхронизации
   * SOLID: Отдельный метод для ручного запуска
   */
  async manualSync() {
    await this.performSync('ручная');
  }

  /**
   * Синхронизация вопросов опроса
   * SOLID: Отдельная ответственность
   */
  async syncQuestions() {
    try {
      const result = await syncSurveyQuestions();
      
      // Не отправляем уведомления - это служебная операция
      // Уведомления нужны только при ошибках
      if (!result.success) {
        await notifyAdmin(
          `❌ *Ошибка синхронизации вопросов*\n\n` +
          `Ошибка: ${result.error}`
        );
      }
    } catch (error) {
      console.error('Ошибка синхронизации вопросов:', error.message);
      await notifyAdmin(
        `❌ *Критическая ошибка синхронизации вопросов*\n\n` +
        `Ошибка: ${error.message}`
      );
    }
  }

  /**
   * Отправка персонализированных уведомлений
   * SOLID: Отдельный метод для уведомлений
   */
  async sendPersonalizedNotifications() {
    try {
      const result = await advancedNotificationService.sendPersonalizedNotifications();
      
      if (result.success && result.sent > 0) {
        await notifyAdmin(
          `🔔 *Рассылка завершена*\n\n` +
          `• Отправлено: ${result.sent}\n` +
          `• Пользователей: ${result.users_processed}`
        );
      }
    } catch (error) {
      console.error('Ошибка рассылки:', error.message);
    }
  }

  /**
   * Получение статуса планировщика
   * DRY: Переиспользуемая логика получения статуса
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobsCount: this.jobs.length,
      nextRuns: this.jobs.map(job => job.nextDate?.toISOString() || 'N/A')
    };
  }
}

// Экспортируем singleton instance
export const syncScheduler = new SyncScheduler();
