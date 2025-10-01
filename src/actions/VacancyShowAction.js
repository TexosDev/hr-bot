import { BaseAction } from './BaseAction.js';
import { getVacanciesFromSupabase } from '../services/supabase/supabaseVacancies.js';
import { getVacancyById, createVacancyDetailKeyboard } from '../services/vacancies.js';

/**
 * Действие показа краткого описания вакансии из списка категории
 * Следует принципам SOLID, DRY, KISS
 */
export class VacancyShowAction extends BaseAction {
  constructor() {
    super(/^vacancy_/);
  }

  async execute(ctx) {
    const vacancyId = this.extractParams(ctx.callbackQuery.data, 'vacancy_');
    
    try {
      const vacancies = await getVacanciesFromSupabase();
      const vacancy = getVacancyById(vacancies, vacancyId);
      
      if (!vacancy) {
        await this.answerCallback(ctx, '❌ Вакансия не найдена');
        return;
      }

      // Показываем краткое описание вакансии (как в старом коде)
      const message = `📋 **${vacancy.emoji} ${vacancy.title}**\n\n` +
                     `📝 ${vacancy.description}\n\n` +
                     `📊 Уровень: ${vacancy.level || 'Любой'}\n` +
                     `💰 Зарплата: ${vacancy.salary || 'По договоренности'}\n\n` +
                     `Выберите действие:`;
      
      const keyboard = createVacancyDetailKeyboard(vacancy, false);
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      
      await this.answerCallback(ctx, `Показана вакансия: ${vacancy.title}`);
    } catch (error) {
      await this.handleError(ctx, error, 'показа вакансии');
    }
  }
}
