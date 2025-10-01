# 🚀 Деплой HR Bot + WebApp

> **Дата:** 2025-10-01 | **Статус:** Production Ready

---

## ⚠️ ВАЖНО: Почему НЕ Vercel для бота?

**Vercel** - это serverless платформа для:
- ✅ Статических сайтов
- ✅ API routes (короткие запросы)
- ❌ **НЕ для long-running процессов**

**Telegram Bot** - это:
- Long-running процесс (должен работать 24/7)
- Polling или Webhook режим
- Cron jobs (планировщик)
- ❌ **НЕ работает на Vercel**

---

## 🎯 РЕКОМЕНДУЕМАЯ АРХИТЕКТУРА

### Вариант 1: Всё на одном хостинге (ПРОЩЕ) ⭐

**Railway.app** - бесплатно до $5/месяц

```
Railway.app (всё вместе):
├── Telegram Bot (Node.js)
├── Webhook сервер (Express)
├── WebApp (статика)
└── Scheduler (cron)
```

**Преимущества:**
- ✅ Всё в одном месте
- ✅ Не нужно настраивать CORS
- ✅ Простой деплой
- ✅ Бесплатный tier

---

### Вариант 2: Раздельный (СЛОЖНЕЕ)

```
Railway.app:                    Vercel:
├── Telegram Bot               ├── WebApp (HTML/CSS/JS)
├── API для WebApp             └── (только статика)
└── Scheduler

Supabase:
└── База данных
```

**Преимущества:**
- ✅ WebApp на CDN (быстрее)
- ❌ Сложнее настройка CORS
- ❌ Больше конфигурации

---

## 🚂 ВАРИАНТ 1: Railway.app (РЕКОМЕНДУЕТСЯ)

### Шаг 1: Подготовка проекта

```bash
# 1. Создайте .gitignore (если нет)
cat > .gitignore << EOL
node_modules/
.env
*.log
.DS_Store
EOL

# 2. Убедитесь что package.json правильный
```

**Проверьте `package.json`:**

```json
{
  "name": "kate-bot",
  "version": "3.2.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node src/index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### Шаг 2: Регистрация на Railway

1. Перейдите на **https://railway.app**
2. Зарегистрируйтесь через GitHub
3. Получите бесплатный tier ($5 кредитов)

---

### Шаг 3: Создание проекта

```bash
# 1. Установите Railway CLI (опционально)
npm install -g @railway/cli

# 2. Залогиньтесь
railway login

# 3. Инициализируйте проект
railway init
```

**ИЛИ через Web UI:**

1. Нажмите **"New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Подключите ваш репозиторий
4. Railway автоматически определит Node.js проект

---

### Шаг 4: Настройка Environment Variables

В Railway Dashboard → **Variables** добавьте:

```bash
# Telegram
BOT_TOKEN=your_bot_token_from_botfather
ADMIN_ID=your_telegram_id
ADMIN_USERNAME=your_username

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Sheets
GOOGLE_SHEETS_ID=your_sheets_id
GOOGLE_QUESTIONS_SHEET_ID=your_questions_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key_with_newlines

# WebApp URL (будет доступен после деплоя)
WEBAPP_URL=https://your-app-name.up.railway.app/webapp/index.html

# Webhook
ENABLE_WEBHOOK=true
WEBHOOK_PORT=3001

# Node environment
NODE_ENV=production
```

---

### Шаг 5: Получение PUBLIC URL

Railway автоматически создаст URL:

1. В Railway Dashboard → **Settings**
2. **Networking** → **Generate Domain**
3. Получите URL вида: `https://your-app-name.up.railway.app`
4. Обновите `WEBAPP_URL` в переменных

---

### Шаг 6: Деплой

```bash
# Через CLI:
railway up

# ИЛИ через Git:
git add .
git commit -m "Deploy to Railway"
git push origin main
```

Railway автоматически:
- ✅ Установит зависимости (`npm install`)
- ✅ Запустит бота (`npm start`)
- ✅ Поднимет webhook сервер
- ✅ Запустит планировщик

---

### Шаг 7: Проверка

```bash
# В Railway Dashboard → Logs проверьте:
✅ Бот запущен
✅ Webhook сервер: http://localhost:3001
✅ Scheduler started
```

**Протестируйте:**

1. Откройте Telegram → найдите бота → `/start`
2. Откройте `https://your-app-name.up.railway.app/webapp/index.html`
3. Проверьте что WebApp загружается

---

## 🎨 ВАРИАНТ 2: WebApp на Vercel отдельно

Если хотите WebApp на Vercel (для CDN и быстрой загрузки):

### Подготовка

**Структура репозитория:**

```
kate_bot/
├── webapp/              ← Переместим в отдельный репо
│   ├── index.html
│   ├── css/
│   └── js/
└── ...
```

---

### Шаг 1: Создайте отдельный репозиторий для WebApp

```bash
# В корне kate_bot:
mkdir kate-bot-webapp
cp -r webapp/* kate-bot-webapp/
cd kate-bot-webapp

git init
git add .
git commit -m "Initial WebApp"
git remote add origin https://github.com/your-username/kate-bot-webapp.git
git push -u origin main
```

---

### Шаг 2: Создайте `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

---

### Шаг 3: Деплой на Vercel

```bash
# 1. Установите Vercel CLI
npm install -g vercel

# 2. Залогиньтесь
vercel login

# 3. Деплой
vercel
```

**ИЛИ через Web UI:**

1. Перейдите на **https://vercel.com**
2. **Import Project** → выберите `kate-bot-webapp`
3. Vercel автоматически задеплоит

Получите URL: `https://kate-bot-webapp.vercel.app`

---

### Шаг 4: Обновите API URL в WebApp

**В `webapp/js/config.js`:**

```javascript
// Поменяйте на Railway URL
const API_BASE_URL = 'https://your-app-name.up.railway.app';
```

---

### Шаг 5: Настройте CORS на Railway

**В `src/services/webhook.js`:**

```javascript
setupMiddleware() {
  this.app.use(express.json());
  this.app.use(express.urlencoded({ extended: true }));
  
  // CORS для Vercel
  this.app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://kate-bot-webapp.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });
}
```

---

## 🔧 НАСТРОЙКА WEBHOOK (опционально)

Если хотите использовать Webhook вместо Polling:

```bash
# В Railway environment variables добавьте:
WEBHOOK_URL=https://your-app-name.up.railway.app
```

**В коде измените режим:**

```javascript
// src/index.js
if (process.env.WEBHOOK_URL) {
  await bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/webhook`);
  console.log('✅ Webhook установлен');
} else {
  await bot.launch();
  console.log('✅ Бот запущен (polling)');
}
```

---

## 💰 СТОИМОСТЬ

### Railway.app

- **Бесплатно:** $5 кредитов/месяц
- **Starter:** $5/месяц (500 часов)
- **Pro:** $20/месяц (unlimited)

**Для бота хватит бесплатного tier!**

---

### Vercel (если WebApp отдельно)

- **Hobby:** Бесплатно
- **Bandwidth:** 100GB/месяц
- **Builds:** Unlimited

**Для WebApp хватит бесплатного!**

---

### Supabase

- **Free tier:**
  - 500MB базы
  - 2GB bandwidth/месяц
  - 50,000 запросов/месяц

**Для HR бота хватит бесплатного!**

---

## 📊 МОНИТОРИНГ

### Railway Logs

```bash
# В Railway Dashboard → Logs
# Или через CLI:
railway logs
```

**Что смотреть:**
```
✅ Бот запущен
✅ Webhook сервер запущен
✅ Scheduler started
✅ Отправлено X уведомлений
```

---

### Health Check

Создайте endpoint для проверки:

**В `src/services/webhook.js`:**

```javascript
setupRoutes() {
  // ... existing routes
  
  this.app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
}
```

**Проверка:**
```bash
curl https://your-app-name.up.railway.app/health
```

---

## 🔒 БЕЗОПАСНОСТЬ

### 1. Секреты

✅ Все секреты в Environment Variables  
❌ НЕ коммитьте .env в Git

### 2. CORS

Настройте только разрешенные домены:

```javascript
const ALLOWED_ORIGINS = [
  'https://kate-bot-webapp.vercel.app',
  process.env.WEBAPP_URL
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  next();
});
```

### 3. Rate Limiting

Добавьте в `package.json`:

```bash
npm install express-rate-limit
```

**В `webhook.js`:**

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // максимум 100 запросов
});

this.app.use('/api/', limiter);
```

---

## 📝 ЧЕКЛИСТ ДЕПЛОЯ

### Перед деплоем:

- [ ] `.gitignore` настроен (не коммитим .env)
- [ ] `package.json` правильный (scripts, engines)
- [ ] Environment variables готовы
- [ ] Supabase таблицы созданы
- [ ] Google Sheets настроены
- [ ] Webhook сервер тестирован локально

### После деплоя:

- [ ] Бот работает в Telegram
- [ ] WebApp открывается
- [ ] WebApp сохраняет данные
- [ ] Вакансии синхронизируются
- [ ] Уведомления работают
- [ ] Логи чистые (нет ошибок)

---

## 🚀 БЫСТРЫЙ ДЕПЛОЙ (TL;DR)

```bash
# 1. Railway
railway login
railway init
railway up

# 2. Добавьте environment variables в Dashboard

# 3. Получите PUBLIC URL

# 4. Обновите WEBAPP_URL в variables

# 5. Проверьте /start в Telegram

# ГОТОВО! 🎉
```

---

## 🆘 TROUBLESHOOTING

### Бот не запускается

```bash
# Проверьте логи:
railway logs

# Частые проблемы:
# 1. BOT_TOKEN неправильный
# 2. NODE_ENV не установлен
# 3. package.json неправильный
```

### WebApp не загружается

```bash
# Проверьте:
# 1. WEBAPP_URL правильный
# 2. Статические файлы доступны
# 3. CORS настроен

curl https://your-app-name.up.railway.app/webapp/index.html
```

### Уведомления не работают

```bash
# Проверьте:
# 1. Scheduler запущен (в логах)
# 2. user_tags созданы
# 3. vacancy_tags созданы
# 4. notifications таблица пустая (нет дубликатов)
```

---

## 📚 ПОЛЕЗНЫЕ ССЫЛКИ

- **Railway:** https://railway.app
- **Vercel:** https://vercel.com
- **Supabase:** https://supabase.com
- **Telegram Bot API:** https://core.telegram.org/bots/api

---

**Версия:** 1.0  
**Дата:** 2025-10-01  
**Рекомендация:** Railway.app для всего ⭐

