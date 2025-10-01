import { parseFile } from '../services/fileParser.js';
import { uploadFileToDrive } from '../services/googleDrive.js';
import { addRowToSheet } from '../services/googleSheets.js';
import { addResponseToSupabase } from '../services/supabase/supabaseResponses.js';
import { parseContacts } from '../utils/contacts.js';
import { CONFIG } from '../config/constants.js';
import { getSelectedVacancy } from '../utils/session.js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Обработка документов
export async function handleDocument(ctx, driveService, sheetsService, sheetId, folderId) {
  console.log('🚀 Начало обработки документа');
  
  // Проверяем, выбрана ли вакансия
  const userId = ctx.from.id;
  const selectedVacancy = getSelectedVacancy(userId);
  console.log('🔍 Проверка вакансии для пользователя:', userId);
  console.log('🔍 Выбранная вакансия:', selectedVacancy);
  
  // Если вакансия не выбрана, используем общее резюме
  if (!selectedVacancy) {
    console.log('⚠️ Вакансия не выбрана, обрабатываем как общее резюме');
  }
  
  console.log('✅ Вакансия выбрана:', selectedVacancy ? selectedVacancy.title : 'Общее резюме');
  console.log('🔍 Проверка переменных:');
  console.log('📊 Sheet ID:', sheetId);
  console.log('📁 Folder ID:', folderId);
  console.log('📧 Admin Chat ID:', process.env.ADMIN_CHAT_ID);
  
  try {
    const doc = ctx.message.document;
    const fileMeta = { 
      fileName: doc.file_name || '', 
      mime: doc.mime_type || '' 
    };

    // Получение файла из Telegram
    const file = await ctx.telegram.getFile(doc.file_id);
    const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Парсинг текста
    const parsed = await parseFile(buffer, fileMeta.fileName, fileMeta.mime);
    const fileText = parsed.text?.slice(0, CONFIG.MAX_TEXT_PREVIEW) || '';
    
    // Получаем caption (текст сообщения) если есть
    const caption = ctx.message.caption || '';
    const textPreview = caption ? `${caption}\n\n${fileText}` : fileText;

    // Создание ссылки на Telegram сообщение
    const messageId = ctx.message.message_id;
    const chatId = ctx.chat.id;
    
    // Правильный формат ссылки для приватных чатов с ботом
    const botUsername = process.env.BOT_USERNAME || 'your_bot_username';
    let telegramLink = `https://t.me/${botUsername}?start=msg_${messageId}`;
    
    console.log('📱 Создана ссылка на Telegram сообщение:', telegramLink);
    console.log('💬 Chat ID:', chatId);
    console.log('📨 Message ID:', messageId);

    // Извлечение контактов
    const { email, phone, fullNameGuess } = parseContacts(textPreview);
    
    // Используем first_name из Telegram как приоритетное имя
    const telegramName = ctx.from.first_name || '';
    const finalName = telegramName || fullNameGuess || '';

    // Получаем выбранную вакансию из нашего хранилища
    const userId = ctx.from.id;
    const selectedVacancy = getSelectedVacancy(userId);
    const vacancyTitle = selectedVacancy ? selectedVacancy.title : 'Общее резюме';

    // Подготовка данных для записи
    const rowData = [
      new Date().toISOString(),
      ctx.from.id,
      ctx.from.username || '',
      finalName, // Используем first_name из Telegram
      email,
      phone,
      fileMeta.fileName,
      fileMeta.mime,
      telegramLink, // Ссылка на Telegram сообщение вместо Drive
      'new',
      vacancyTitle, // Выбранная вакансия
      textPreview
    ];


    // Уведомление админу (всегда отправляем, даже если Google не работает)
    try {
      const adminMsg = CONFIG.MESSAGES.ADMIN_NOTIFICATION(
        ctx.from, 
        email, 
        phone, 
        fileMeta.fileName, 
        telegramLink, // Ссылка на Telegram сообщение
        vacancyTitle, // Выбранная вакансия
        textPreview // Текст из резюме
      );
      await ctx.telegram.sendMessage(process.env.ADMIN_CHAT_ID, adminMsg);
      console.log('✅ Уведомление админу отправлено');
    } catch (notificationError) {
      console.error('❌ Ошибка отправки уведомления админу:', notificationError);
    }

    // Отправка в группу с резюме (если настроена)
    console.log('🔍 Проверка настроек группы...');
    console.log('📋 RESUME_GROUP_ID:', CONFIG.RESUME_GROUP_ID);
    console.log('📋 process.env.RESUME_GROUP_ID:', process.env.RESUME_GROUP_ID);
    
    const resumeGroupId = process.env.RESUME_GROUP_ID;
    
    if (resumeGroupId) {
      try {
        console.log('📤 Отправка в группу:', resumeGroupId);
        
        const groupMsg = CONFIG.MESSAGES.GROUP_RESUME_MESSAGE(
          ctx.from,
          vacancyTitle,
          fileMeta.fileName,
          textPreview
        );
        
        console.log('📝 Сообщение для группы:', groupMsg);
        
        const groupMessage = await ctx.telegram.sendMessage(resumeGroupId, groupMsg, {
          parse_mode: 'HTML'
        });
        
        // Отправляем файл в группу
        await ctx.telegram.forwardMessage(resumeGroupId, ctx.chat.id, ctx.message.message_id);
        
        // Обновляем ссылку на сообщение в группе
        const groupMessageLink = `https://t.me/c/${resumeGroupId.replace('-100', '')}/${groupMessage.message_id}`;
        console.log('🔗 Ссылка на сообщение в группе:', groupMessageLink);
        
        // Обновляем ссылку в данных для записи
        telegramLink = groupMessageLink;
        
        console.log('✅ Резюме отправлено в группу');
      } catch (groupError) {
        console.error('❌ Ошибка отправки в группу:', groupError);
        console.error('❌ Детали ошибки:', groupError.response?.data || groupError.message);
      }
    } else {
      console.log('⚠️ RESUME_GROUP_ID не настроен - пропускаем отправку в группу');
    }

    // Запись в Google Sheets (после отправки в группу для получения правильной ссылки)
    try {
      console.log('📊 Попытка записи в Google Sheets...');
      console.log('📋 ID таблицы:', sheetId);
      console.log('📋 Диапазон:', CONFIG.RESPONSES_SHEET_RANGE);
      console.log('📋 Данные для записи:', rowData);
      console.log('📋 Sheets Service:', !!sheetsService);
      
      // Сохраняем в Supabase
      const responseData = {
        user_id: userId,
        username: ctx.from.username || '',
        first_name: ctx.from.first_name || '',
        email: contacts.email || '',
        phone: contacts.phone || '',
        file_name: fileName,
        file_mime: mimeType,
        telegram_link: telegramLink,
        status: 'new',
        vacancy_title: vacancyTitle,
        text_preview: textPreview
      };
      
      const response = await addResponseToSupabase(responseData);
      if (response) {
        console.log('✅ Данные записаны в Supabase');
      } else {
        console.log('❌ Ошибка записи в Supabase');
      }
      
      // Также сохраняем в Google Sheets для админки
      await addRowToSheet(sheetsService, sheetId, CONFIG.RESPONSES_SHEET_RANGE, rowData);
      console.log('✅ Данные записаны в Google Sheets (админка)');
    } catch (sheetsError) {
      console.error('❌ Ошибка записи в Google Sheets:', sheetsError.message);
      console.error('❌ Полная ошибка:', sheetsError);
    }

    // Ответ пользователю
    if (selectedVacancy) {
      await ctx.reply(
        `🎉 **Ваш отклик отправлен!**\n\n` +
        `${selectedVacancy.emoji} **${selectedVacancy.title}**\n\n` +
        `✅ Резюме успешно получено\n` +
        `📋 Мы рассмотрим вашу кандидатуру\n` +
        `📞 Свяжемся с вами в ближайшее время\n\n` +
        `💡 Обычно мы отвечаем в течение 1-2 дней`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Другие вакансии', callback_data: 'back_to_categories' }]
            ]
          }
        }
      );
    } else {
      await ctx.reply(
        '✅ **Резюме получено!**\n\n' +
        '📋 Ваше резюме сохранено в нашей базе.\n\n' +
        '💡 Когда появится подходящая вакансия, мы сразу с вами свяжемся!',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Посмотреть вакансии', callback_data: 'back_to_categories' }]
            ]
          }
        }
      );
    }

  } catch (error) {
    console.error('❌ Ошибка обработки документа:', error);
    await ctx.reply(CONFIG.MESSAGES.ERROR);
  }
  
  console.log('✅ Обработка документа завершена');
}
