import { BaseCommand } from './BaseCommand.js';
import { getVacanciesFromSupabase } from '../services/supabase/supabaseVacancies.js';
import { createMainMenuKeyboard } from '../services/vacancies.js';

export class VacanciesCommand extends BaseCommand {
  constructor() {
    super('vacancies');
  }

  async execute(ctx) {
    try {
      const vacancies = await getVacanciesFromSupabase();
      const userName = ctx.from?.first_name || 'друг';
      
      if (vacancies.length === 0) {
        const webAppUrl = process.env.WEBAPP_URL || `http://localhost:3001/webapp/index.html`;
        
        await ctx.reply(
          `� Привет, ${userName}!\n\n` +
          '� *Сейчас нет активных вакансий*\n\n' +
          ' *Но есть отличное решение:*\n' +
          'Подпишитесь на обновления → Вы первым узнаете о новых вакансиях\\!\n\n' +
          ' Или можете отправить резюме прямо сейчас\\.',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: ' Подписаться на обновления', web_app: { url: webAppUrl } }],
                [
                  { text: ' Мои подписки', callback_data: 'my_subscriptions' },
                  { text: ' Помощь', callback_data: 'show_help' }
                ],
                [{ text: '� Связаться с админом', url: `https://t.me/${process.env.ADMIN_USERNAME || 'admin'}` }]
              ]
            }
          }
        );
        return;
      }

      const keyboard = createMainMenuKeyboard(vacancies);
      
      await ctx.reply(
        `� Привет, ${userName}!\n\n` +
        ` Сейчас доступно ${vacancies.length} ${this.getVacanciesWord(vacancies.length)}\n\n` +
        '� Выберите категорию:',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup
        }
      );
    } catch (error) {
      await this.handleError(ctx, error, 'показа вакансий');
    }
  }

  getVacanciesWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'вакансия';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'вакансии';
    return 'вакансий';
  }

  getDescription() {
    return 'показать доступные вакансии';
  }
}
