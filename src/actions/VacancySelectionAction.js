import { BaseAction } from './BaseAction.js';
import { getVacanciesFromSupabase } from '../services/supabase/supabaseVacancies.js';
import { getVacancyById, createVacancyDetailKeyboard, createAfterSelectionKeyboard } from '../services/vacancies.js';
import { setSelectedVacancy } from '../utils/session.js';

/**
 * Действие выбора вакансии
 * Следует принципам SOLID, DRY, KISS
 */
export class VacancySelectionAction extends BaseAction {
  constructor() {
    super(/^select_vacancy_/);
  }

  async execute(ctx) {
    const vacancyId = this.extractParams(ctx.callbackQuery.data, 'select_vacancy_');
    
    try {
      const vacancies = await getVacanciesFromSupabase();
      const vacancy = getVacancyById(vacancies, vacancyId);
      
      if (!vacancy) {
        await this.handleVacancyNotFound(ctx);
        return;
      }

      await this.handleVacancySelection(ctx, vacancy);
    } catch (error) {
      await this.handleError(ctx, error, 'выбора вакансии');
    }
  }

  /**
   * Обработка выбора вакансии
   * KISS: Простая логика
   */
  async handleVacancySelection(ctx, vacancy) {
    // Сохраняем выбранную вакансию в сессии
    setSelectedVacancy(ctx.from.id, vacancy);
    
    // Показываем сообщение о выборе вакансии с предложением подписки
    const message = ` **Вакансия выбрана!**\n\n` +
                   ` **${vacancy.emoji} ${vacancy.title}**\n\n` +
                   ` ${vacancy.description}\n\n` +
                   ` Уровень: ${vacancy.level || 'Любой'}\n` +
                   ` Зарплата: ${vacancy.salary || 'По договоренности'}\n\n` +
                   `Теперь пришлите ваше резюме в виде файла (PDF, DOC, DOCX, TXT).`;
    
    const keyboard = createAfterSelectionKeyboard(vacancy);
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup
    });
    
    await this.answerCallback(ctx, `Выбрана вакансия: ${vacancy.title}`);
  }

  /**
   * Создание сообщения о вакансии
   * DRY: Переиспользуемая логика
   */
  createVacancyMessage(vacancy) {
    return ` **${vacancy.emoji} ${vacancy.title}**\n\n` +
           ` ${vacancy.description}\n\n` +
           ` Уровень: ${vacancy.level || 'Любой'}\n` +
           ` Зарплата: ${vacancy.salary || 'По договоренности'}\n\n` +
           `Выберите действие:`;
  }

  /**
   * Обработка случая когда вакансия не найдена
   * DRY: Переиспользуемая логика
   */
  async handleVacancyNotFound(ctx) {
    await this.answerCallback(ctx, ' Вакансия не найдена');
  }
}
