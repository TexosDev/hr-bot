import 'dotenv/config';
import { Telegraf } from 'telegraf';

console.log('🧪 Тестирование отправки в группу...');
console.log('📋 RESUME_GROUP_ID из .env:', process.env.RESUME_GROUP_ID);

if (!process.env.RESUME_GROUP_ID) {
  console.log('❌ RESUME_GROUP_ID не настроен в .env файле!');
  console.log('📝 Добавьте в .env:');
  console.log('   RESUME_GROUP_ID=-1001234567890');
  process.exit(1);
}

if (!process.env.BOT_TOKEN) {
  console.log('❌ BOT_TOKEN не настроен!');
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

async function testGroupMessage() {
  try {
    const testMessage = `🧪 **Тестовое сообщение**\n\n` +
      `👤 **Кандидат:** @test_user (Тест Тестович)\n` +
      `📋 **Вакансия:** Frontend Developer\n` +
      `📄 **Файл:** test.pdf\n\n` +
      `📝 **Описание:**\nТестовое резюме для проверки отправки в группу\n\n` +
      `#Frontend_Developer #HR #Работа`;

    console.log('📤 Отправка тестового сообщения в группу...');
    
    await bot.telegram.sendMessage(process.env.RESUME_GROUP_ID, testMessage, {
      parse_mode: 'Markdown'
    });
    
    console.log('✅ Тестовое сообщение отправлено успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка отправки тестового сообщения:', error);
    console.error('📋 Детали ошибки:', error.response?.data || error.message);
    
    if (error.response?.error_code === 403) {
      console.log('💡 Возможные причины:');
      console.log('   - Бот не добавлен в группу');
      console.log('   - Бот не является администратором группы');
      console.log('   - Неправильный ID группы');
    }
  }
}

testGroupMessage();

