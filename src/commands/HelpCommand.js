import { BaseCommand } from './BaseCommand.js';
import { CONFIG } from '../config/constants.js';

export class HelpCommand extends BaseCommand {
  constructor() {
    super('help');
  }

  async execute(ctx) {
    try {
      const webAppUrl = process.env.WEBAPP_URL || `http://localhost:3001/webapp/index.html`;
      
      await ctx.reply(CONFIG.MESSAGES.HELP, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Начать', callback_data: 'back_to_main' }],
            [{ text: '📋 Вакансии', callback_data: 'show_vacancies' }],
            [
              { text: '🔔 Подписаться на обновления', web_app: { url: webAppUrl } }
            ],
            [
              { text: '📊 Мои подписки', callback_data: 'my_subscriptions' }
            ]
          ]
        }
      });
    } catch (error) {
      await this.handleError(ctx, error, 'показа помощи');
    }
  }

  getDescription() {
    return 'показать справку по командам';
  }
}
