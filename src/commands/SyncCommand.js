import { BaseCommand } from './BaseCommand.js';
import { syncVacanciesFromSheetsToSupabase } from '../services/supabase/syncSheetsSupabase.js';

export class SyncCommand extends BaseCommand {
  constructor() {
    super('sync');
  }

  async execute(ctx) {
    if (!this.isAdmin(ctx)) {
      await ctx.reply(
        '� **Команда только для администратора**\n\n' +
        ' Все данные синхронизируются автоматически:\n' +
        '• Вакансии - каждые 30 минут\n' +
        '• Вопросы - каждый час\n' +
        '• Уведомления - каждые 2 часа\n\n' +
        'Вам не нужно беспокоиться о синхронизации! �',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    await ctx.reply(
      ' **Ручная синхронизация**\n\n' +
      '⚙ Начинаю синхронизацию вакансий...\n' +
      '⏱ Обычно автосинхронизация: каждые 30 минут',
      { parse_mode: 'Markdown' }
    );
    
    try {
      const result = await syncVacanciesFromSheetsToSupabase();
      
      if (result?.success) {
        await this.showSuccessMessage(ctx, result);
      } else {
        await this.showErrorMessage(ctx, result?.error || 'Неизвестная ошибка');
      }
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      await this.showErrorMessage(ctx, error.message || 'Неизвестная ошибка');
    }
  }

  async showSuccessMessage(ctx, result) {
    await ctx.reply(
      ` Синхронизация завершена!\n\n` +
      ` Результаты:\n` +
      `• Новых вакансий: ${result.synced}\n` +
      `• Обновленных: ${result.updated}\n\n` +
      ` Вакансии обновлены в боте!`
    );
  }

  async showErrorMessage(ctx, error) {
    await ctx.reply(` Ошибка синхронизации: ${error}`);
  }

  getDescription() {
    return 'принудительная синхронизация вакансий (только для админа, обычно не нужна)';
  }
}
