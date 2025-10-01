import { Telegraf } from 'telegraf';

class TelegramNotificationService {
  constructor() {
    this.bot = null;
    this.adminId = process.env.ADMIN_CHAT_ID;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) {
      return;
    }

    if (!process.env.BOT_TOKEN) {
      console.warn(' BOT_TOKEN не найден, уведомления отключены');
      return;
    }

    if (!this.adminId) {
      console.warn(' ADMIN_CHAT_ID не найден, уведомления отключены');
      return;
    }

    try {
      this.bot = new Telegraf(process.env.BOT_TOKEN);
      this.isInitialized = true;
      console.log(' Сервис уведомлений инициализирован');
    } catch (error) {
      console.error(' Ошибка инициализации уведомлений:', error);
    }
  }

  async notifyAdmin(message, options = {}) {
    if (!this.isInitialized || !this.bot) {
      console.log(' Уведомления отключены:', message);
      return;
    }

    try {
      await this.bot.telegram.sendMessage(this.adminId, message, {
        parse_mode: 'Markdown',
        ...options
      });
      console.log(' Уведомление отправлено админу');
    } catch (error) {
      console.error(' Ошибка отправки уведомления:', error);
    }
  }

  /**
   * Отправка уведомления о синхронизации
   * DRY: Переиспользуемая логика для синхронизации
   */
  async notifySyncResult(result, type = 'синхронизация') {
    if (!result.success) {
      await this.notifyAdmin(
        ` *Ошибка ${type}*\n\n` +
        `Ошибка: ${result.error}\n` +
        `Время: ${new Date().toLocaleString('ru-RU')}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const vacancies = result.vacancies || {};
    const subscriptions = result.subscriptions || {};
    
    // Отправляем уведомление только если есть изменения
    if (this.hasChanges(result)) {
      await this.notifyAdmin(
        ` *${type} завершена*\n\n` +
        ` *Результаты:*\n` +
        `• Вакансии: ${vacancies.synced || 0} новых, ${vacancies.updated || 0} обновленных\n` +
        `• Подписки: ${subscriptions.synced || 0} синхронизированных\n\n` +
        `⏰ ${new Date().toLocaleString('ru-RU')}`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  /**
   * Отправка уведомления о критической ошибке
   * SOLID: Отдельный метод для критических ошибок
   */
  async notifyCriticalError(error, context = '') {
    await this.notifyAdmin(
      `� *КРИТИЧЕСКАЯ ОШИБКА*\n\n` +
      `Контекст: ${context}\n` +
      `Ошибка: ${error.message}\n` +
      `Время: ${new Date().toLocaleString('ru-RU')}\n\n` +
      `Стек: \`${error.stack?.substring(0, 500)}\``,
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * Отправка уведомления о запуске бота
   * DRY: Переиспользуемая логика для статуса
   */
  async notifyBotStart() {
    await this.notifyAdmin(
      ` *Бот запущен*\n\n` +
      `Время: ${new Date().toLocaleString('ru-RU')}\n` +
      `Статус: Все системы работают`,
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * Проверка наличия изменений
   * KISS: Простая логика проверки
   */
  hasChanges(result) {
    const vacancies = result.vacancies || {};
    const subscriptions = result.subscriptions || {};
    
    return (vacancies.synced > 0 || vacancies.updated > 0 || subscriptions.synced > 0);
  }

  /**
   * Отправка тестового уведомления
   * SOLID: Отдельный метод для тестирования
   */
  async sendTestNotification() {
    await this.notifyAdmin(
      `🧪 *Тестовое уведомление*\n\n` +
      `Время: ${new Date().toLocaleString('ru-RU')}\n` +
      `Статус: Уведомления работают корректно`,
      { parse_mode: 'Markdown' }
    );
  }
}

// Экспортируем singleton instance и функцию для обратной совместимости
export const telegramNotifications = new TelegramNotificationService();
export const notifyAdmin = (message, options) => telegramNotifications.notifyAdmin(message, options);
