import { BaseAction } from './BaseAction.js';
import { getSelectedVacancy, clearSession } from '../utils/session.js';
import { createAfterSelectionKeyboard, createCancelKeyboard } from '../services/vacancies.js';

/**
 * Действия для работы с откликами
 * Следует принципам SOLID, DRY, KISS
 */

/**
 * Отмена отклика (новый простой flow)
 */
export class CancelApplyAction extends BaseAction {
  constructor() {
    super('cancel_apply');
  }

  async execute(ctx) {
    try {
      clearSession(ctx.from.id);
      
      await ctx.editMessageText(
        '❌ **Отклик отменен**\n\n' +
        'Вы можете выбрать другую вакансию или просто посмотреть список.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Посмотреть вакансии', callback_data: 'back_to_categories' }]
            ]
          }
        }
      );
      
      await this.answerCallback(ctx, 'Отклик отменен');
    } catch (error) {
      await this.handleError(ctx, error, 'отмены отклика');
    }
  }
}

/**
 * Изменение отклика
 */
export class ChangeResponseAction extends BaseAction {
  constructor() {
    super('change_response');
  }

  async execute(ctx) {
    try {
      const selectedVacancy = getSelectedVacancy(ctx.from.id);
      
      if (!selectedVacancy) {
        await this.answerCallback(ctx, '❌ Сначала выберите вакансию');
        return;
      }

      await ctx.editMessageText(
        '🔄 **Изменение отклика**\n\n' +
        `Выбранная вакансия: ${selectedVacancy.emoji} ${selectedVacancy.title}\n\n` +
        'Пришлите новое резюме или выберите другую вакансию.',
        {
          parse_mode: 'Markdown',
          reply_markup: createAfterSelectionKeyboard(selectedVacancy).reply_markup
        }
      );
      
      await this.answerCallback(ctx, 'Изменение отклика');
    } catch (error) {
      await this.handleError(ctx, error, 'изменения отклика');
    }
  }
}

/**
 * Отмена отклика
 */
export class CancelResponseAction extends BaseAction {
  constructor() {
    super('cancel_response');
  }

  async execute(ctx) {
    try {
      const selectedVacancy = getSelectedVacancy(ctx.from.id);
      
      if (!selectedVacancy) {
        await this.answerCallback(ctx, '❌ Нет активного отклика для отмены');
        return;
      }

      await ctx.editMessageText(
        '❌ **Отмена отклика**\n\n' +
        `Вы уверены, что хотите отменить отклик на вакансию "${selectedVacancy.title}"?`,
        {
          parse_mode: 'Markdown',
          reply_markup: createCancelKeyboard().reply_markup
        }
      );
      
      await this.answerCallback(ctx, 'Подтверждение отмены');
    } catch (error) {
      await this.handleError(ctx, error, 'отмены отклика');
    }
  }
}

/**
 * Подтверждение отмены
 */
export class ConfirmCancelAction extends BaseAction {
  constructor() {
    super('confirm_cancel');
  }

  async execute(ctx) {
    try {
      clearSession(ctx.from.id);
      
      await ctx.editMessageText(
        '✅ **Отклик отменен**\n\n' +
        'Ваш отклик был отменен. Вы можете выбрать другую вакансию или отправить резюме в свободной форме.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Выбрать вакансию', callback_data: 'show_vacancies' }],
              [{ text: '📝 Отправить резюме', callback_data: 'send_resume' }]
            ]
          }
        }
      );
      
      await this.answerCallback(ctx, 'Отклик отменен');
    } catch (error) {
      await this.handleError(ctx, error, 'подтверждения отмены');
    }
  }
}

/**
 * Сохранение отклика
 */
export class KeepResponseAction extends BaseAction {
  constructor() {
    super('keep_response');
  }

  async execute(ctx) {
    try {
      const selectedVacancy = getSelectedVacancy(ctx.from.id);
      
      if (!selectedVacancy) {
        await this.answerCallback(ctx, '❌ Нет выбранной вакансии');
        return;
      }

      await ctx.editMessageText(
        '✅ **Отклик сохранен**\n\n' +
        `Вакансия: ${selectedVacancy.emoji} ${selectedVacancy.title}\n\n` +
        'Теперь пришлите ваше резюме в виде файла (PDF, DOC, DOCX, TXT).',
        {
          parse_mode: 'Markdown',
          reply_markup: createAfterSelectionKeyboard(selectedVacancy).reply_markup
        }
      );
      
      await this.answerCallback(ctx, 'Отклик сохранен');
    } catch (error) {
      await this.handleError(ctx, error, 'сохранения отклика');
    }
  }
}
