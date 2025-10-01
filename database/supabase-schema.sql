-- Создание таблиц для HR бота в Supabase

-- Таблица вакансий
CREATE TABLE IF NOT EXISTS vacancies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    category VARCHAR(100) NOT NULL,
    link VARCHAR(500),
    level VARCHAR(50),
    salary VARCHAR(100),
    requirements TEXT,
    benefits TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица откликов
CREATE TABLE IF NOT EXISTS responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    file_name VARCHAR(255),
    file_mime VARCHAR(100),
    telegram_link VARCHAR(500),
    status VARCHAR(50) DEFAULT 'new',
    vacancy_id UUID REFERENCES vacancies(id),
    vacancy_title VARCHAR(255),
    text_preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица подписок
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL,
    username VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_vacancies_category ON vacancies(category);
CREATE INDEX IF NOT EXISTS idx_vacancies_active ON vacancies(is_active);
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_vacancy_id ON responses(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_vacancies_updated_at 
    BEFORE UPDATE ON vacancies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responses_updated_at 
    BEFORE UPDATE ON responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка тестовых данных
INSERT INTO vacancies (title, description, emoji, category, level, salary, requirements, benefits) VALUES
('Frontend Developer', 'Разработка пользовательских интерфейсов', '💻', 'IT/Разработка', 'Middle', '150-200k', 'React, Vue, JavaScript', 'Удаленка, гибкий график'),
('Backend Developer', 'Разработка серверной части', '⚙️', 'IT/Разработка', 'Senior', '200-300k', 'Node.js, Python, PostgreSQL', 'Спортзал, медстраховка'),
('UI/UX Designer', 'Создание дизайна интерфейсов', '🎨', 'Дизайн', 'Middle', '120-180k', 'Figma, Adobe XD, Sketch', 'Креативная команда'),
('Product Manager', 'Управление продуктом', '📈', 'Менеджмент', 'Senior', '180-250k', 'Опыт в IT, аналитика', 'Карьерный рост')
ON CONFLICT DO NOTHING;

-- Создание представления для статистики
CREATE OR REPLACE VIEW stats_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM vacancies WHERE is_active = true) as active_vacancies,
    (SELECT COUNT(*) FROM responses) as total_responses,
    (SELECT COUNT(*) FROM subscriptions) as total_subscriptions,
    (SELECT COUNT(*) FROM responses WHERE created_at >= NOW() - INTERVAL '7 days') as responses_last_week,
    (SELECT COUNT(*) FROM subscriptions WHERE created_at >= NOW() - INTERVAL '7 days') as subscriptions_last_week;

-- Настройка RLS (Row Level Security) - опционально
-- ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Политики RLS (если нужно ограничить доступ)
-- CREATE POLICY "Allow all operations for authenticated users" ON vacancies FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for authenticated users" ON responses FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for authenticated users" ON subscriptions FOR ALL USING (true);
