# 🏗️ Архитектура базы данных Supabase

## 📊 Обзор системы

База данных состоит из **4 подсистем**:

```
┌─────────────────────────────────────────┐
│         БАЗА ДАННЫХ SUPABASE            │
├─────────────────────────────────────────┤
│                                         │
│  1️⃣  ОСНОВНЫЕ ТАБЛИЦЫ                  │
│     • vacancies (вакансии)              │
│     • responses (отклики)               │
│     • subscriptions (подписки - старое) │
│                                         │
│  2️⃣  СИСТЕМА ПОДПИСОК (новая)          │
│     • user_preferences (предпочтения)   │
│     • notifications (уведомления)       │
│                                         │
│  3️⃣  СИСТЕМА ТЕГОВ                     │
│     • tags (теги)                       │
│     • vacancy_tags (теги вакансий)      │
│     • user_tags (теги пользователей)    │
│                                         │
│  4️⃣  СИСТЕМА ВОПРОСОВ                  │
│     • survey_categories (категории)     │
│     • survey_fields (поля формы)        │
│                                         │
└─────────────────────────────────────────┘
```

---

## 1️⃣ Основные таблицы

### **vacancies** - Вакансии

**Назначение:** Хранит все вакансии

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Уникальный ID |
| title | VARCHAR(255) | Название вакансии |
| description | TEXT | Описание |
| emoji | VARCHAR(10) | Эмодзи для отображения |
| category | VARCHAR(100) | Категория |
| link | VARCHAR(500) | Ссылка на вакансию |
| level | VARCHAR(50) | Уровень (Junior/Middle/Senior) |
| salary | VARCHAR(100) | Зарплата |
| requirements | TEXT | Требования |
| benefits | TEXT | Преимущества |
| tags | TEXT[] | Массив тегов (новое) |
| salary_min | INTEGER | Мин. зарплата (новое) |
| salary_max | INTEGER | Макс. зарплата (новое) |
| work_type | VARCHAR(50) | Формат работы (новое) |
| experience_level | VARCHAR(50) | Уровень опыта (новое) |
| location | VARCHAR(100) | Локация (новое) |
| is_active | BOOLEAN | Активна ли |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

**Управление:**
- 📊 Через Google Таблицу (вакансии)
- 🔄 Синхронизация: `npm run sync`

### **responses** - Отклики пользователей

**Назначение:** Хранит отклики на вакансии

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Уникальный ID |
| user_id | BIGINT | Telegram ID пользователя |
| username | VARCHAR(100) | Telegram username |
| first_name | VARCHAR(100) | Имя |
| email | VARCHAR(255) | Email |
| phone | VARCHAR(50) | Телефон |
| file_name | VARCHAR(255) | Имя файла резюме |
| file_mime | VARCHAR(100) | Тип файла |
| telegram_link | VARCHAR(500) | Ссылка на Telegram |
| status | VARCHAR(50) | Статус (new/viewed/contacted) |
| vacancy_id | UUID | ID вакансии |
| vacancy_title | VARCHAR(255) | Название вакансии |
| text_preview | TEXT | Превью текста |
| created_at | TIMESTAMP | Дата отклика |
| updated_at | TIMESTAMP | Дата обновления |

**Связи:**
- `vacancy_id` → `vacancies.id`

### **subscriptions** - Подписки (старая система)

**Назначение:** Старая система подписок (может быть удалена)

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Уникальный ID |
| user_id | BIGINT | Telegram ID |
| username | VARCHAR(100) | Username |
| category | VARCHAR(100) | Категория подписки |
| created_at | TIMESTAMP | Дата подписки |

**Статус:** Опциональная, заменена на `user_preferences`

---

## 2️⃣ Система подписок (новая)

### **user_preferences** - Предпочтения пользователей

**Назначение:** Хранит подробные предпочтения пользователей из WebApp формы

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Уникальный ID записи |
| user_id | BIGINT | Telegram ID (или отрицательное для WebApp) |
| username | VARCHAR(100) | Telegram username |
| first_name | VARCHAR(100) | Имя пользователя |
| preferences | JSONB | JSON с предпочтениями |
| is_active | BOOLEAN | Активна ли подписка |
| subscription_type | VARCHAR(50) | Тип (survey_based) |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

**Структура preferences (JSONB):**
```json
{
  "specialization": ["frontend"],
  "technologies": ["React", "TypeScript"],
  "experience": ["2-3 года"],
  "work_format": ["Удалёнка"],
  "location": "Россия, Европа",
  "salary_range": "150000 руб/мес",
  "resume_link": "https://hh.ru/resume/123",
  "has_resume": false,
  "source": "webapp",
  "completed_at": "2025-01-01T12:00:00Z"
}
```

**Заполняется:** Через WebApp форму (`/webapp/`)

### **notifications** - История уведомлений

**Назначение:** Отслеживает какие вакансии отправлены каким пользователям

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Уникальный ID |
| user_id | BIGINT | Telegram ID |
| vacancy_id | UUID | ID вакансии |
| status | VARCHAR(20) | Статус (sent/delivered/failed) |
| sent_at | TIMESTAMP | Когда отправлено |
| delivered_at | TIMESTAMP | Когда доставлено |
| error_message | TEXT | Текст ошибки если есть |

**Связи:**
- `vacancy_id` → `vacancies.id`

**Назначение:** Предотвращает повторную отправку одной вакансии пользователю

---

## 3️⃣ Система тегов

### **tags** - Теги

**Назначение:** Справочник тегов (технологии, направления, опыт)

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Уникальный ID |
| name | VARCHAR(100) | Название тега (уникальное) |
| category | VARCHAR(50) | Категория (technology/direction/experience/work_type) |
| description | TEXT | Описание |
| is_active | BOOLEAN | Активен ли |
| created_at | TIMESTAMP | Дата создания |

**Примеры:**
- React (technology)
- Frontend (direction)  
- Middle (experience)
- Удаленка (work_type)

### **vacancy_tags** - Связь вакансий с тегами

**Назначение:** Какие теги относятся к какой вакансии

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Уникальный ID |
| vacancy_id | UUID | ID вакансии |
| tag_name | VARCHAR(100) | Название тега |
| relevance_score | INTEGER | Релевантность (1-10) |
| created_at | TIMESTAMP | Дата создания |

**Связи:**
- `vacancy_id` → `vacancies.id`
- `tag_name` → `tags.name`

**Уникальность:** (vacancy_id, tag_name) - вакансия не может иметь дублирующихся тегов

### **user_tags** - Связь пользователей с тегами

**Назначение:** Какие теги интересуют пользователя

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Уникальный ID |
| user_id | BIGINT | Telegram ID |
| tag_name | VARCHAR(100) | Название тега |
| preference_level | INTEGER | Уровень интереса (1-10) |
| created_at | TIMESTAMP | Дата создания |

**Связи:**
- `tag_name` → `tags.name`

**Уникальность:** (user_id, tag_name) - у пользователя не дублируются теги

---

## 4️⃣ Система вопросов

### **survey_categories** - Категории вопросов

**Назначение:** Категории специализаций (Frontend, Backend и т.д.)

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Уникальный ID |
| category_key | VARCHAR(100) | Ключ категории (уникальный) |
| name | VARCHAR(255) | Название |
| description | TEXT | Описание |
| icon | VARCHAR(50) | Эмодзи |
| is_active | BOOLEAN | Активна ли |
| display_order | INTEGER | Порядок отображения |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

**Примеры:**
- frontend → Frontend Development
- backend → Backend Development

**Управление:**
- 📊 Через Google Таблицу (лист "Категории")
- 🔄 Синхронизация: `npm run sync-questions`

### **survey_fields** - Поля формы

**Назначение:** Поля формы WebApp (общие и специфичные для категорий)

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Уникальный ID |
| category_key | VARCHAR(100) | Ключ категории (NULL = общее поле) |
| field_key | VARCHAR(100) | Ключ поля |
| field_type | VARCHAR(50) | Тип (string/number/select/multiselect/boolean) |
| label | VARCHAR(255) | Название поля |
| placeholder | TEXT | Подсказка |
| options | JSONB | Опции для select/multiselect |
| is_required | BOOLEAN | Обязательное поле |
| is_common | BOOLEAN | Общее для всех категорий |
| display_order | INTEGER | Порядок отображения |
| validation_rules | JSONB | Правила валидации |
| is_active | BOOLEAN | Активно ли |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

**Примеры:**
- name (общее поле) → string → "Имя"
- stack (frontend) → multiselect → "Стек" → ["React", "Vue"]

**Управление:**
- 📊 Через Google Таблицу (лист "Поля")
- 🔄 Синхронизация: `npm run sync-questions`

**Уникальность:** (category_key, field_key) - поле уникально в рамках категории

---

## 🔗 Связи между таблицами

```
vacancies ─┬─→ responses (vacancy_id)
           ├─→ notifications (vacancy_id)
           └─→ vacancy_tags (vacancy_id)

tags ──────┬─→ vacancy_tags (tag_name)
           └─→ user_tags (tag_name)

user_preferences ──→ user_tags (user_id)

survey_categories ──→ survey_fields (category_key)
```

---

## 📝 Какие SQL файлы выполнять

### **Первый раз (создание БД):**

```bash
# 1. Основные таблицы
database/supabase-schema.sql

# 2. Система подписок и тегов
database/simple-new-tables.sql

# 3. Система вопросов
database/survey-questions-schema.sql
```

### **Проверка:**

```bash
npm run check-db
```

---

## 📊 Индексы для оптимизации

### Таблица vacancies
- `idx_vacancies_category` - по категории
- `idx_vacancies_active` - по активности
- `idx_vacancies_tags` (GIN) - по тегам
- `idx_vacancies_work_type` - по формату работы
- `idx_vacancies_experience` - по опыту

### Таблица user_preferences
- `idx_user_preferences_user` - по user_id
- `idx_user_preferences_active` - по активности

### Таблица notifications
- `idx_notifications_user` - по user_id
- `idx_notifications_vacancy` - по vacancy_id

### Таблица tags
- `idx_tags_category` - по категории

### Таблица survey_categories
- `idx_survey_categories_key` - по category_key
- `idx_survey_categories_active` - по активности
- `idx_survey_categories_order` - по порядку

### Таблица survey_fields
- `idx_survey_fields_category` - по category_key
- `idx_survey_fields_common` - по is_common
- `idx_survey_fields_active` - по активности
- `idx_survey_fields_order` - по порядку

---

## 🔄 Триггеры

### Автообновление updated_at

Для таблиц: `vacancies`, `responses`

```sql
CREATE TRIGGER update_vacancies_updated_at 
    BEFORE UPDATE ON vacancies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📈 Статистика и аналитика

### View: stats_dashboard

```sql
SELECT * FROM stats_dashboard;
```

**Возвращает:**
- active_vacancies - Активных вакансий
- total_responses - Всего откликов
- total_subscriptions - Всего подписок
- responses_last_week - Откликов за неделю
- subscriptions_last_week - Подписок за неделю

---

## 🔐 Безопасность (RLS)

**Row Level Security:** По умолчанию **отключен**

Для включения (в продакшне):

```sql
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Создать политики доступа
CREATE POLICY "Allow all for anon" ON vacancies 
    FOR ALL USING (true);
```

---

## 💾 Размер данных

### Ожидаемый объем

| Таблица | Записей | Размер |
|---------|---------|--------|
| vacancies | 100-1000 | ~1-10 MB |
| responses | 1000-10000 | ~5-50 MB |
| user_preferences | 100-10000 | ~1-10 MB |
| notifications | 10000-100000 | ~10-100 MB |
| tags | 50-200 | ~10 KB |
| survey_categories | 10-20 | ~5 KB |
| survey_fields | 50-200 | ~50 KB |

**Общий размер БД:** ~20-200 MB (в зависимости от нагрузки)

---

## 🚀 Работа с данными

### Создание вакансии

```javascript
import { addVacancyToSupabase } from './src/services/supabase/supabaseVacancies.js';

await addVacancyToSupabase({
    title: 'Frontend Developer',
    category: 'IT/Разработка',
    // ...
});
```

### Сохранение предпочтений

```javascript
import { saveUserPreferences } from './src/services/supabase/supabaseUserPreferences.js';

await saveUserPreferences(userId, userInfo, preferences);
```

### Получение категорий вопросов

```javascript
import { getSurveyCategories } from './src/services/supabase/supabaseSurveyQuestions.js';

const categories = await getSurveyCategories();
```

---

## 🔧 Обслуживание

### Очистка старых данных

```sql
-- Удалить старые уведомления (старше 3 месяцев)
DELETE FROM notifications 
WHERE sent_at < NOW() - INTERVAL '3 months';

-- Деактивировать неактивных пользователей
UPDATE user_preferences 
SET is_active = false 
WHERE updated_at < NOW() - INTERVAL '6 months';
```

### Резервное копирование

Supabase автоматически делает бэкапы, но можно:

```bash
# Экспорт данных
npm run export-data  # TODO: создать скрипт

# Или через Supabase Dashboard
# Settings → Database → Backups
```

---

## ✅ Проверка целостности

### Команда

```bash
npm run check-db
```

### Что проверяется

- ✅ Существование всех таблиц
- ✅ Количество записей
- ✅ Наличие обязательных колонок
- ✅ Связи между таблицами

---

## 📚 SQL файлы

| Файл | Назначение | Когда использовать |
|------|-----------|-------------------|
| `supabase-schema.sql` | Основные таблицы | ⭐ Первый раз |
| `simple-new-tables.sql` | Подписки и теги | ⭐ Первый раз |
| `survey-questions-schema.sql` | Система вопросов | ⭐ Первый раз |
| `advanced-survey-schema.sql` | Расширенная система | ⚠️ Не используется |
| `fixed-new-tables.sql` | Исправления | ⚠️ Не используется |
| `new-subscription-schema.sql` | Альтернативная схема | ⚠️ Не используется |

---

## 🎯 Рекомендации

### ✅ Используйте:
1. `supabase-schema.sql` - основа
2. `simple-new-tables.sql` - подписки
3. `survey-questions-schema.sql` - вопросы

### ❌ Не используйте:
- `advanced-survey-schema.sql`
- `fixed-new-tables.sql`
- `new-subscription-schema.sql`

(Это старые версии или альтернативные варианты)

---

## 🔍 Проверка прямо сейчас

Запустите:

```bash
npm run check-db
```

Вы получите полный отчет о состоянии всех таблиц!

---

**Версия:** 1.0 | **Дата:** 2025

