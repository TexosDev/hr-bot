-- Упрощенная схема для новой системы подписок
-- Выполните эти запросы в SQL Editor Supabase Dashboard

-- 1. Обновляем таблицу vacancies для поддержки тегов
ALTER TABLE vacancies 
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS salary_min INTEGER,
ADD COLUMN IF NOT EXISTS salary_max INTEGER,
ADD COLUMN IF NOT EXISTS work_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- 2. Создаем таблицу предпочтений пользователей
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    username VARCHAR(100),
    first_name VARCHAR(100),
    preferences JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    subscription_type VARCHAR(50) DEFAULT 'survey_based',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Создаем таблицу уведомлений
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL,
    vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- 4. Создаем таблицу тегов
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Создаем таблицу связи вакансий с тегами
CREATE TABLE IF NOT EXISTS vacancy_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    relevance_score INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vacancy_id, tag_name)
);

-- 6. Создаем таблицу связи пользователей с тегами
CREATE TABLE IF NOT EXISTS user_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    preference_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tag_name)
);

-- 7. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_vacancies_tags ON vacancies USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_vacancies_work_type ON vacancies(work_type);
CREATE INDEX IF NOT EXISTS idx_vacancies_experience ON vacancies(experience_level);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_active ON user_preferences(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_vacancy ON notifications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_vacancy_tags_vacancy ON vacancy_tags(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_user ON user_tags(user_id);

-- 8. Вставляем базовые теги
INSERT INTO tags (name, category, description) VALUES
('React', 'technology', 'JavaScript библиотека для UI'),
('Vue.js', 'technology', 'JavaScript фреймворк'),
('Node.js', 'technology', 'JavaScript runtime'),
('Python', 'technology', 'Язык программирования'),
('JavaScript', 'technology', 'Язык программирования'),
('TypeScript', 'technology', 'Типизированный JavaScript'),
('Frontend', 'direction', 'Фронтенд разработка'),
('Backend', 'direction', 'Бэкенд разработка'),
('Fullstack', 'direction', 'Полный стек'),
('Mobile', 'direction', 'Мобильная разработка'),
('DevOps', 'direction', 'DevOps инженерия'),
('QA', 'direction', 'Тестирование'),
('Design', 'direction', 'Дизайн'),
('Marketing', 'direction', 'Маркетинг'),
('Junior', 'experience', 'Начинающий разработчик'),
('Middle', 'experience', 'Опытный разработчик'),
('Senior', 'experience', 'Старший разработчик'),
('Lead', 'experience', 'Тимлид'),
('Удаленка', 'work_type', 'Удаленная работа'),
('Офис', 'work_type', 'Работа в офисе'),
('Гибрид', 'work_type', 'Смешанный формат')
ON CONFLICT (name) DO NOTHING;
