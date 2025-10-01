import 'dotenv/config';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

async function resetWebhook() {
  try {
    console.log('🔄 Удаляем старый webhook...');
    
    // Удаляем webhook
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    
    console.log('✅ Webhook удален!');
    console.log('💡 Теперь можно запустить бот заново');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

resetWebhook();

