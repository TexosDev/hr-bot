import { BaseAction } from './BaseAction.js';
import { getVacanciesFromSupabase } from '../services/supabase/supabaseVacancies.js';
import { getVacancyById, createVacancyDetailKeyboard, createDetailedVacancyMessage, createCategoryKeyboard, createMainMenuKeyboard, groupVacanciesByCategory } from '../services/vacancies.js';
import { setSelectedVacancy, getSelectedVacancy, clearSession } from '../utils/session.js';

/**
 * Отклик на вакансию - новый упрощенный flow
 */
export class ApplyToVacancyAction extends BaseAction {
  constructor() {
    super(/^apply_/);
  }

  async execute(ctx) {
    const vacancyId = this.extractParams(ctx.callbackQuery.data, 'apply_');
    
    try {
      const vacancies = await getVacanciesFromSupabase();
      const vacancy = getVacancyById(vacancies, vacancyId);
      
      if (!vacancy) {
        await this.answerCallback(ctx, ' Вакансия не найдена');
        return;
      }

      // Сохраняем выбранную вакансию
      setSelectedVacancy(ctx.from.id, vacancy);

      await ctx.editMessageText(
        ` **Отлично! Откликаемся на вакансию:**\n\n` +
        `${vacancy.emoji} **${vacancy.title}**\n\n` +
        ` **Следующий шаг:** Отправьте ваше резюме\n\n` +
        ` Поддерживаются форматы:\n` +
        `• PDF (.pdf)\n` +
        `• Word (.doc, .docx)\n` +
        `• Текст (.txt)\n\n` +
        `Просто прикрепите файл в следующем сообщении �`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: ' Выбрать другую вакансию', callback_data: 'back_to_categories' }],
              [{ text: ' Отменить', callback_data: 'cancel_apply' }]
            ]
          }
        }
      );
      
      await this.answerCallback(ctx, ' Ожидаем ваше резюме');
    } catch (error) {
      await this.handleError(ctx, error, 'отклика на вакансию');
    }
  }
}

/**
 * Действия для работы с вакансиями
 * Следует принципам SOLID, DRY, KISS
 */

/**
 * Показ детальной информации о вакансии
 */
export class VacancyDetailAction extends BaseAction {
  constructor() {
    super(/^detail_/);
  }

  async execute(ctx) {
    const vacancyId = this.extractParams(ctx.callbackQuery.data, 'detail_');
    
    try {
      const vacancies = await getVacanciesFromSupabase();
      console.log(' VacancyDetailAction - vacancies:', vacancies ? vacancies.length : 'undefined');
      
      const vacancy = getVacancyById(vacancies, vacancyId);
      
      if (!vacancy) {
        await this.answerCallback(ctx, ' Вакансия не найдена');
        return;
      }

      console.log(' VacancyDetailAction - vacancy:', vacancy.title);
      const message = createDetailedVacancyMessage(vacancy, vacancies);
      const keyboard = createVacancyDetailKeyboard(vacancy, true);
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      
      await this.answerCallback(ctx, `Показано подробное описание: ${vacancy.title}`);
    } catch (error) {
      await this.handleError(ctx, error, 'показа подробного описания');
    }
  }
}

/**
 * Показ краткой информации о вакансии
 */
export class VacancyBriefAction extends BaseAction {
  constructor() {
    super(/^brief_/);
  }

  async execute(ctx) {
    const vacancyId = this.extractParams(ctx.callbackQuery.data, 'brief_');
    
    try {
      const vacancies = await getVacanciesFromSupabase();
      const vacancy = getVacancyById(vacancies, vacancyId);
      
      if (!vacancy) {
        await this.answerCallback(ctx, ' Вакансия не найдена');
        return;
      }

      const message = ` **${vacancy.emoji} ${vacancy.title}**\n\n` +
                     ` ${vacancy.description}\n\n` +
                     ` Уровень: ${vacancy.level || 'Любой'}\n` +
                     ` Зарплата: ${vacancy.salary || 'По договоренности'}\n\n` +
                     `Выберите действие:`;
      
      const keyboard = createVacancyDetailKeyboard(vacancy, false);
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
      });
      
      await this.answerCallback(ctx, `Показано краткое описание: ${vacancy.title}`);
    } catch (error) {
      await this.handleError(ctx, error, 'показа краткого описания');
    }
  }
}

/**
 * Показ категории вакансий
 */
export class CategoryAction extends BaseAction {
  constructor() {
    super(/^category_/);
  }

  async execute(ctx) {
    const categoryKey = this.extractParams(ctx.callbackQuery.data, 'category_');
    
    try {
      const vacancies = await getVacanciesFromSupabase();
      const categories = groupVacanciesByCategory(vacancies);
      
      // Находим категорию по ключу (как в старом коде)
      const categoryName = Object.keys(categories).find(name => 
        name.toLowerCase().replace(/\s+/g, '_') === categoryKey
      );
      
      if (categoryName && categories[categoryName]) {
        const categoryVacancies = categories[categoryName];
        const message = ` **${categoryName}:**\n\nВыберите вакансию:`;
        
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: createCategoryKeyboard(categoryVacancies, categoryName).reply_markup
        });
        
        await this.answerCallback(ctx, `Показаны вакансии категории: ${categoryName}`);
      } else {
        await this.answerCallback(ctx, ' Категория не найдена');
      }
    } catch (error) {
      await this.handleError(ctx, error, 'показа категории');
    }
  }
}

/**
 * Возврат к категориям
 */
export class BackToCategoriesAction extends BaseAction {
  constructor() {
    super('back_to_categories');
  }

  async execute(ctx) {
    try {
      const vacancies = await getVacanciesFromSupabase();
      const keyboard = createMainMenuKeyboard(vacancies);
      
      await ctx.editMessageText(
        '� Добро пожаловать!\n\nВыберите категорию вакансий:',
        {
          reply_markup: keyboard.reply_markup
        }
      );
      
      await this.answerCallback(ctx, 'Возврат к категориям');
    } catch (error) {
      await this.handleError(ctx, error, 'возврата к категориям');
    }
  }
}

/**
 * Возврат к категории
 */
export class BackToCategoryAction extends BaseAction {
  constructor() {
    super(/^back_to_category_/);
  }

  async execute(ctx) {
    const categoryName = this.extractParams(ctx.callbackQuery.data, 'back_to_category_');
    
    try {
      const vacancies = await getVacanciesFromSupabase();
      const categories = groupVacanciesByCategory(vacancies);
      
      if (categoryName && categories[categoryName]) {
        const categoryVacancies = categories[categoryName];
        const message = ` **${categoryName}:**\n\nВыберите вакансию:`;
        
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: createCategoryKeyboard(categoryVacancies, categoryName).reply_markup
        });
        
        await this.answerCallback(ctx, `Возврат к категории: ${categoryName}`);
      } else {
        await this.answerCallback(ctx, ' Категория не найдена');
      }
    } catch (error) {
      await this.handleError(ctx, error, 'возврата к категории');
    }
  }
}
