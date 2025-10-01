// Скрипт для ручной установки webhook
// Использование: node scripts/set-webhook-manual.js YOUR_BOT_TOKEN YOUR_WEBHOOK_URL

const botToken = process.argv[2];
const webhookUrl = process.argv[3];

if (!botToken || !webhookUrl) {
  console.error('❌ Использование: node scripts/set-webhook-manual.js YOUR_BOT_TOKEN YOUR_WEBHOOK_URL');
  console.error('Пример: node scripts/set-webhook-manual.js 123456:ABC... https://your-domain.railway.app/webhook/telegram');
  process.exit(1);
}

async function setWebhook() {
  try {
    console.log(`📡 Устанавливаем webhook: ${webhookUrl}`);
    
    const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Webhook установлен успешно!');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Ошибка:', data);
    }
    
    // Проверяем установку
    console.log('\n🔍 Проверяем webhook...');
    const infoUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const infoResponse = await fetch(infoUrl);
    const infoData = await infoResponse.json();
    
    console.log('📋 Информация о webhook:');
    console.log(JSON.stringify(infoData, null, 2));
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

setWebhook();

