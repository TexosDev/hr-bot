import { BaseCommand } from './BaseCommand.js';

export class WebAppCommand extends BaseCommand {
  constructor() {
    super('webapp');
  }

  async execute(ctx) {
    const webAppUrl = process.env.WEBAPP_URL || `http://localhost:3001/webapp/index.html`;
    
    const message = ' **Откройте профиль**\n\n' +
      'компании отберут вакансии специально для вас и напишут напрямую\n\n' +
      '✨ **Как это работает:**\n' +
      '• Вы выбираете специализацию и навыки\n' +
      '• Система создает ваш профиль\n' +
      '• Рекрутеры видят ваши предпочтения\n' +
      '• Вы получаете релевантные предложения\n\n' +
      '� **Современный интерфейс:**\n' +
      '• Красивый дизайн в стиле Telegram\n' +
      '• Простое заполнение формы\n' +
      '• Выбор навыков как тегов\n' +
      '• Быстрое сохранение';

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
            [{
              text: ' Открыть профиль',
              web_app: { url: webAppUrl }
            }],
          [{
            text: ' Посмотреть вакансии',
            callback_data: 'show_vacancies'
          }],
          [{
            text: 'ℹ О простом опросе',
            callback_data: 'simple_survey_info'
          }]
        ]
      }
    };

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  }
}
