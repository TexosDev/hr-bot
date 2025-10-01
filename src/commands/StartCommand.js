import { BaseCommand } from './BaseCommand.js';
import { getVacanciesFromSupabase } from '../services/supabase/supabaseVacancies.js';
import { createMainMenuKeyboard } from '../services/vacancies.js';

export class StartCommand extends BaseCommand {
  constructor() {
    super('start');
  }

  async execute(ctx) {
    const startParam = ctx.message?.text?.split(' ')[1];
    
    if (startParam && startParam.startsWith('msg_')) {
      await this.handleMessageLink(ctx, startParam);
    } else {
      await this.showMainMenu(ctx);
    }
  }

  async handleMessageLink(ctx, startParam) {
    const messageId = startParam.replace('msg_', '');
    await ctx.reply(`� Ссылка на сообщение: ${messageId}\n\nЭто сообщение содержит резюме, которое было отправлено боту.`);
  }

  async showMainMenu(ctx) {
    try {
      const vacancies = await getVacanciesFromSupabase();
      
      if (vacancies.length === 0) {
        await this.showNoVacanciesMessage(ctx);
      } else {
        await this.showVacanciesMenu(ctx, vacancies);
      }
    } catch (error) {
      await this.showErrorFallback(ctx);
    }
  }

  async showNoVacanciesMessage(ctx) {
    const userName = ctx.from.first_name || 'друг';
    const webAppUrl = process.env.WEBAPP_URL || `http://localhost:3001/webapp/index.html`;
    
    await ctx.reply(
      `� Привет, ${userName}!\n\n` +
      '� *Я помогу найти вакансию мечты!*\n\n' +
      '� Сейчас нет активных вакансий\\.\\.\\.\n\n' +
      ' *Но есть отличное решение:*\n' +
      'Заполните профиль → Вы первым узнаете о новых вакансиях\\!\n\n' +
      ' Или можете отправить резюме прямо сейчас\\.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: ' Подписаться на обновления', web_app: { url: webAppUrl } }],
            [{ text: '� Связаться с админом', url: `https://t.me/${process.env.ADMIN_USERNAME || 'admin'}` }]
          ]
        }
      }
    );
  }

  async showVacanciesMenu(ctx, vacancies) {
    const userName = ctx.from.first_name || 'друг';
    const webAppUrl = process.env.WEBAPP_URL || `http://localhost:3001/webapp/index.html`;
    
    await ctx.reply(
      `� Привет, ${userName}!\n\n` +
      '� *Я помогу найти вакансию мечты!*\n\n' +
      ` Сейчас доступно ${vacancies.length} ${this.getVacanciesWord(vacancies.length)}\n\n` +
      ' *Что я умею:*\n' +
      '• Показать актуальные вакансии\n' +
      '• Принять ваш отклик на вакансию\n' +
      '• Отправлять персонализированные уведомления\n\n' +
      ' *Как работает подписка:*\n' +
      'Заполните профиль → Получайте подходящие вакансии автоматически\\!\n\n' +
      '� *Выберите действие:*',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: ' Посмотреть вакансии', callback_data: 'show_vacancies' }],
            [{ text: ' Подписаться на обновления', web_app: { url: webAppUrl } }],
            [
              { text: ' Мои подписки', callback_data: 'my_subscriptions' },
              { text: ' Помощь', callback_data: 'show_help' }
            ]
          ]
        }
      }
    );
  }

  getVacanciesWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'вакансия';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'вакансии';
    return 'вакансий';
  }

  async showErrorFallback(ctx) {
    await ctx.reply(
      ' **Произошел сбой при загрузке вакансий**\n\n' +
      ' Пришлите нам свое резюме, и когда появится подходящая вакансия, мы сразу с вами свяжемся!',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: ' Отправить резюме', callback_data: 'send_resume' }]
          ]
        }
      }
    );
  }

  getDescription() {
    return 'начать работу с ботом';
  }
}
