import { CONFIG } from '../config/constants.js';
import { getSelectedVacancy } from '../utils/session.js';

// Обработка текстовых сообщений
export async function handleText(ctx, sheetsService, sheetId) {
  console.log(' Начало обработки текста');
  
  // Проверяем, выбрана ли вакансия
  const userId = ctx.from.id;
  const selectedVacancy = getSelectedVacancy(userId);
  
  if (!selectedVacancy) {
    console.log(' Вакансия не выбрана, показываем справку');
    await ctx.reply(
      '� **Привет!**\n\n' +
      ' Чтобы откликнуться на вакансию:\n' +
      '1. Выберите интересующую вакансию\n' +
      '2. Нажмите " Откликнуться"\n' +
      '3. Отправьте файл резюме\n\n' +
      ' Хотите посмотреть вакансии?',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: ' Посмотреть вакансии', callback_data: 'show_vacancies' }],
            [{ text: '� Связаться с админом', url: `https://t.me/${process.env.ADMIN_USERNAME || 'admin'}` }]
          ]
        }
      }
    );
    return;
  }
  
  console.log(' Вакансия выбрана:', selectedVacancy.title);
  
  // Напоминаем что нужен файл резюме
  console.log(' Текстовое сообщение - напоминаем про файл');
  await ctx.reply(
    ` **Ожидаем файл резюме**\n\n` +
    `${selectedVacancy.emoji} Вакансия: **${selectedVacancy.title}**\n\n` +
    ` Пожалуйста, прикрепите файл:\n` +
    `• PDF (.pdf)\n` +
    `• Word (.doc, .docx)\n` +
    `• Текст (.txt)\n\n` +
    `Текстовые сообщения не обрабатываются �`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: ' Выбрать другую вакансию', callback_data: 'back_to_categories' }],
          [{ text: ' Отменить отклик', callback_data: 'cancel_apply' }]
        ]
      }
    }
  );
}