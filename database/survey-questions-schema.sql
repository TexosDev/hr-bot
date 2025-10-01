-- Схема для хранения вопросов опроса в Supabase
-- Управляется через Google Таблицу как админку

-- 1. Таблица категорий опроса
CREATE TABLE IF NOT EXISTS survey_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Таблица полей формы
CREATE TABLE IF NOT EXISTS survey_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_key VARCHAR(100), -- NULL = общее поле для всех категорий
    field_key VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- string, number, select, multiselect, boolean
    label VARCHAR(255) NOT NULL,
    placeholder TEXT,
    options JSONB, -- Массив опций для select/multiselect
    is_required BOOLEAN DEFAULT false,
    is_common BOOLEAN DEFAULT false, -- Общее поле для всех категорий
    display_order INTEGER DEFAULT 0,
    validation_rules JSONB, -- Дополнительные правила валидации
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_key, field_key)
);

-- 3. Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_survey_categories_key ON survey_categories(category_key);
CREATE INDEX IF NOT EXISTS idx_survey_categories_active ON survey_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_categories_order ON survey_categories(display_order);

CREATE INDEX IF NOT EXISTS idx_survey_fields_category ON survey_fields(category_key);
CREATE INDEX IF NOT EXISTS idx_survey_fields_common ON survey_fields(is_common);
CREATE INDEX IF NOT EXISTS idx_survey_fields_active ON survey_fields(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_fields_order ON survey_fields(display_order);

-- 4. Вставка примерных категорий
INSERT INTO survey_categories (category_key, name, description, icon, display_order) VALUES
('frontend', 'Frontend Development', 'Разработка пользовательских интерфейсов', '🎨', 1),
('backend', 'Backend Development', 'Серверная разработка и API', '⚙️', 2),
('fullstack', 'Fullstack Development', 'Полный цикл разработки', '🚀', 3),
('devops', 'DevOps / Infrastructure', 'Инфраструктура и автоматизация', '🔧', 4),
('mobile', 'Mobile Development', 'Мобильная разработка', '📱', 5),
('data', 'Data / AI', 'Анализ данных и машинное обучение', '📊', 6),
('qa', 'QA / Testing', 'Тестирование и обеспечение качества', '🧪', 7),
('security', 'Security', 'Информационная безопасность', '🔒', 8),
('product', 'Product Management', 'Продуктовый менеджмент', '📋', 9),
('design', 'UX/UI Design', 'Дизайн пользовательского интерфейса', '🎨', 10),
('marketing', 'Digital Marketing', 'Цифровой маркетинг', '📈', 11),
('crypto', 'Crypto / Blockchain', 'Блокчейн и криптовалюты', '₿', 12)
ON CONFLICT (category_key) DO NOTHING;

-- 5. Вставка общих полей (для всех категорий)
INSERT INTO survey_fields (category_key, field_key, field_type, label, placeholder, is_required, is_common, display_order) VALUES
(NULL, 'name', 'string', 'Имя', 'Введите ваше имя', true, true, 1),
(NULL, 'surname', 'string', 'Фамилия', 'Введите вашу фамилию', true, true, 2),
(NULL, 'email', 'string', 'Email', 'your.email@example.com', true, true, 3),
(NULL, 'telegram', 'string', 'Telegram username', '@username', false, true, 4),
(NULL, 'salary_expectation', 'string', 'Ожидаемая зарплата', 'Например: 150000 руб/мес', false, true, 5),
(NULL, 'work_format', 'select', 'Формат работы', NULL, true, true, 6),
(NULL, 'geo_preference', 'string', 'Желаемое GEO', 'Например: Россия, Европа', false, true, 7),
(NULL, 'experience_level', 'select', 'Уровень опыта', NULL, true, true, 8)
ON CONFLICT (category_key, field_key) DO NOTHING;

-- 6. Обновляем опции для select полей
UPDATE survey_fields 
SET options = '["Офис", "Удалёнка", "Гибрид"]'::jsonb
WHERE field_key = 'work_format';

UPDATE survey_fields 
SET options = '["Junior / Entry", "Mid", "Senior", "Lead / Architect", "C-level / Executive"]'::jsonb
WHERE field_key = 'experience_level';

-- 7. Вставка примерных полей для frontend категории
INSERT INTO survey_fields (category_key, field_key, field_type, label, options, is_required, is_common, display_order) VALUES
('frontend', 'stack', 'multiselect', 'Стек', '["React", "Vue", "Angular", "Next.js", "Svelte", "Nuxt"]'::jsonb, false, false, 1),
('frontend', 'experience_years', 'number', 'Опыт работы (лет)', NULL, false, false, 2),
('frontend', 'ui_focus', 'boolean', 'Фокус на UI/UX', NULL, false, false, 3),
('frontend', 'frameworks', 'multiselect', 'Фреймворки / библиотеки', '["Redux", "MobX", "Tailwind", "Material UI", "Styled Components"]'::jsonb, false, false, 4)
ON CONFLICT (category_key, field_key) DO NOTHING;

-- 8. Комментарии к таблицам
COMMENT ON TABLE survey_categories IS 'Категории опросов (Frontend, Backend и т.д.)';
COMMENT ON TABLE survey_fields IS 'Поля формы для каждой категории или общие поля';

COMMENT ON COLUMN survey_fields.category_key IS 'NULL = общее поле для всех категорий';
COMMENT ON COLUMN survey_fields.field_type IS 'string, number, select, multiselect, boolean';
COMMENT ON COLUMN survey_fields.is_common IS 'true = поле показывается для всех категорий';

