# 🚀 Быстрая настройка GitHub и деплой

## 📝 Шаг 1: Настройка Git (если еще не настроен)

```bash
# Настройте ваше имя и email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 📦 Шаг 2: Первый коммит

```bash
# Проверьте что добавлено
git status

# Если нужно, добавьте файлы снова
git add .

# Создайте первый коммит
git commit -m "Initial commit: HR Bot v3.2.0 production ready"
```

---

## 🌐 Шаг 3: Создание GitHub репозитория

### Вариант A: Через Web UI (проще)

1. Перейдите на **https://github.com/new**
2. Заполните:
   - **Repository name:** `kate-bot` (или любое имя)
   - **Description:** `Telegram HR Bot with personalized vacancy notifications`
   - **Public/Private:** На ваш выбор
   - ❌ **НЕ** добавляйте README, .gitignore, license (у нас уже есть)
3. Нажмите **"Create repository"**

---

### Вариант B: Через GitHub CLI (быстрее)

```bash
# Установите GitHub CLI (если еще нет)
# https://cli.github.com/

# Залогиньтесь
gh auth login

# Создайте репозиторий
gh repo create kate-bot --public --source=. --remote=origin --push
```

---

## 🔗 Шаг 4: Подключение к GitHub (если создали через Web UI)

GitHub покажет вам команды. Они будут примерно такие:

```bash
# Подключите удаленный репозиторий
git remote add origin https://github.com/YOUR-USERNAME/kate-bot.git

# Переименуйте ветку в main (если нужно)
git branch -M main

# Запушьте код
git push -u origin main
```

**Замените `YOUR-USERNAME` на ваше имя пользователя GitHub!**

---

## ✅ Проверка

После push проверьте что код появился:

```
https://github.com/YOUR-USERNAME/kate-bot
```

---

## 🚂 Шаг 5: Деплой на Railway

### 1. Перейдите на Railway

```
https://railway.app
```

### 2. Зарегистрируйтесь через GitHub

Нажмите **"Login with GitHub"**

### 3. Создайте новый проект

1. Нажмите **"New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Найдите `kate-bot` в списке
4. Нажмите **"Deploy Now"**

Railway автоматически:
- ✅ Определит Node.js проект
- ✅ Установит зависимости
- ✅ Запустит `npm start`

---

## ⚙️ Шаг 6: Environment Variables

В Railway Dashboard:

1. Откройте ваш проект
2. Перейдите в **Variables**
3. Нажмите **"RAW Editor"**
4. Вставьте:

```bash
BOT_TOKEN=your_bot_token_from_botfather
ADMIN_ID=your_telegram_id
ADMIN_USERNAME=your_username

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

GOOGLE_SHEETS_ID=your_sheets_id
GOOGLE_QUESTIONS_SHEET_ID=your_questions_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour key here\n-----END PRIVATE KEY-----

WEBAPP_URL=https://your-app-name.up.railway.app/webapp/index.html
ENABLE_WEBHOOK=true
WEBHOOK_PORT=3001
NODE_ENV=production
```

5. Нажмите **"Add"**

---

## 🌍 Шаг 7: Получение Public URL

1. В Railway Dashboard → **Settings**
2. Найдите **"Networking"**
3. Нажмите **"Generate Domain"**
4. Railway создаст URL вида: `https://kate-bot-production.up.railway.app`

**ВАЖНО:** Обновите `WEBAPP_URL` в Variables на этот URL:

```
WEBAPP_URL=https://kate-bot-production.up.railway.app/webapp/index.html
```

---

## 🧪 Шаг 8: Тестирование

### 1. Проверьте логи

В Railway Dashboard → **Deployments** → **View Logs**

Должно быть:
```
✅ Бот запущен
✅ Webhook сервер: http://localhost:3001
✅ Scheduler started
```

### 2. Проверьте бота

В Telegram:
```
/start
# Должно показать главное меню

/vacancies
# Должно показать вакансии

/my_subscriptions
# Должно показать статус подписки
```

### 3. Проверьте WebApp

Откройте в браузере:
```
https://your-app-name.up.railway.app/webapp/index.html
```

Заполните форму и проверьте что данные сохраняются.

---

## 🔄 Автоматический деплой

Railway автоматически деплоит при каждом push в main:

```bash
# Внесите изменения
git add .
git commit -m "Update: описание изменений"
git push

# Railway автоматически задеплоит! ✅
```

---

## 📊 Мониторинг

### Railway Dashboard

**Metrics:**
- CPU usage
- Memory usage
- Network traffic

**Logs:**
```bash
# Или через CLI:
railway logs

# Follow logs:
railway logs -f
```

---

## 🆘 Если что-то пошло не так

### Бот не запускается

```bash
# 1. Проверьте логи
railway logs

# 2. Проверьте переменные
# Railway Dashboard → Variables

# 3. Проверьте что BOT_TOKEN правильный
# Telegram → @BotFather → /token
```

### WebApp не открывается

```bash
# 1. Проверьте что Public URL сгенерирован
# Railway Dashboard → Settings → Networking

# 2. Проверьте WEBAPP_URL в Variables

# 3. Проверьте доступность:
curl https://your-app-name.up.railway.app/health
```

### База данных не подключается

```bash
# 1. Проверьте Supabase URL и KEY в Variables

# 2. Проверьте таблицы в Supabase:
# Supabase Dashboard → Table Editor

# 3. Проверьте что таблицы созданы:
# database/simple-new-tables.sql
```

---

## 💰 Стоимость

**Railway.app:**
- Free tier: $5 кредитов/месяц
- Стоимость: ~$0.000231 за минуту ($10/месяц за 24/7)
- **Для HR бота: ~$3-5/месяц** ✅

**Как снизить:**
- Используйте Free tier ($5)
- Оптимизируйте cron jobs
- Используйте Supabase (бесплатно)

---

## ✅ Итоговый чеклист

- [ ] Git настроен
- [ ] Первый коммит сделан
- [ ] GitHub репозиторий создан
- [ ] Код запушен на GitHub
- [ ] Railway проект создан
- [ ] Environment Variables добавлены
- [ ] Public URL сгенерирован
- [ ] WEBAPP_URL обновлен
- [ ] Бот работает в Telegram
- [ ] WebApp открывается
- [ ] Вакансии синхронизируются
- [ ] Уведомления работают

---

## 🎉 ГОТОВО!

Ваш бот задеплоен и работает 24/7!

**Следующие шаги:**
1. Добавьте вакансии в Google Sheets
2. Протестируйте все функции
3. Пригласите пользователей
4. Мониторьте логи

**Удачи! 🚀**

---

## 📚 Полезные команды

```bash
# Посмотреть статус git
git status

# Посмотреть изменения
git diff

# Посмотреть историю коммитов
git log --oneline

# Откатить изменения
git reset --hard HEAD

# Создать новую ветку
git checkout -b feature-name

# Переключиться на main
git checkout main

# Railway логи
railway logs

# Railway status
railway status

# Railway переменные
railway variables
```

