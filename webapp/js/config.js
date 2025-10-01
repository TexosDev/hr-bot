/**
 * Конфигурация данных приложения
 * @module config
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
    BASE_URL: window.location.origin,
    ENDPOINTS: {
        CATEGORIES: '/api/questions/categories',
        FIELDS: '/api/questions/categories',
        ALL_QUESTIONS: '/api/questions/all'
    }
};

/**
 * Загрузить категории из API
 */
export async function loadCategoriesFromAPI() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`);
        const result = await response.json();

        if (result.success) {
            return result.categories;
        }

        console.error(' Ошибка загрузки категорий:', result.error);
        return null;
    } catch (error) {
        console.error(' Ошибка загрузки категорий из API:', error);
        return null;
    }
}

/**
 * Загрузить поля для категории из API
 */
export async function loadFieldsForCategory(categoryKey) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FIELDS}/${categoryKey}/fields`);
        const result = await response.json();

        if (result.success) {
            return result.fields;
        }

        console.error(' Ошибка загрузки полей:', result.error);
        return null;
    } catch (error) {
        console.error(' Ошибка загрузки полей из API:', error);
        return null;
    }
}

/**
 * Навыки по категориям (fallback если API не доступен)
 */
export const skillsByCategory = {
    frontend: [
        'React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'Nuxt',
        'Redux', 'MobX', 'Tailwind', 'Material UI', 'Styled Components'
    ],
    backend: [
        'Node.js', 'Python', 'Go', 'Java', 'PHP', 'Rust', 'C#', 'Kotlin',
        'PostgreSQL', 'MySQL', 'MongoDB', 'Redis'
    ],
    fullstack: [
        'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Go', 'Java',
        'PostgreSQL', 'MongoDB'
    ],
    devops: [
        'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'CI/CD',
        'Prometheus', 'Grafana', 'AWS', 'Azure', 'GCP'
    ],
    mobile: [
        'iOS / Swift', 'Android / Kotlin', 'React Native', 'Flutter'
    ],
    data: [
        'Python', 'Pandas', 'TensorFlow', 'PyTorch', 'Spark', 'Hadoop',
        'SQL', 'R'
    ],
    qa: [
        'Selenium', 'Cypress', 'Jest', 'Postman', 'JMeter',
        'Manual QA', 'Automation'
    ],
    security: [
        'OWASP', 'Penetration Testing', 'CISSP', 'CEH',
        'Network Security', 'Application Security'
    ],
    product: [
        'Product Management', 'Agile', 'Scrum', 'Jira',
        'Analytics', 'User Research'
    ],
    design: [
        'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator',
        'UX Research', 'UI Design'
    ],
    marketing: [
        'Google Analytics', 'Meta Ads', 'SEO', 'PPC',
        'Content Marketing', 'Social Media'
    ],
    crypto: [
        'Ethereum', 'Solidity', 'Web3', 'DeFi', 'NFT',
        'Blockchain', 'Smart Contracts'
    ]
};

/**
 * Категории специализаций
 */
export const categories = [
    { id: 'frontend', name: 'Frontend Development', description: 'Разработка пользовательских интерфейсов' },
    { id: 'backend', name: 'Backend Development', description: 'Серверная разработка и API' },
    { id: 'fullstack', name: 'Fullstack Development', description: 'Полный цикл разработки' },
    { id: 'devops', name: 'DevOps / Infrastructure', description: 'Инфраструктура и автоматизация' },
    { id: 'mobile', name: 'Mobile Development', description: 'Мобильная разработка' },
    { id: 'data', name: 'Data / AI', description: 'Анализ данных и машинное обучение' },
    { id: 'qa', name: 'QA / Testing', description: 'Тестирование и обеспечение качества' },
    { id: 'security', name: 'Security', description: 'Информационная безопасность' },
    { id: 'product', name: 'Product Management', description: 'Продуктовый менеджмент' },
    { id: 'design', name: 'UX/UI Design', description: 'Дизайн пользовательского интерфейса' },
    { id: 'marketing', name: 'Digital Marketing', description: 'Цифровой маркетинг' },
    { id: 'crypto', name: 'Crypto / Blockchain', description: 'Блокчейн и криптовалюты' }
];

/**
 * Опции опыта работы
 */
export const experienceOptions = [
    'Без опыта',
    '< 1 года',
    '1-2 года',
    '2-3 года',
    '3-5 лет',
    '5+ лет'
];

/**
 * Опции формата работы
 */
export const workFormatOptions = [
    { value: 'Офис', label: 'Офис' },
    { value: 'Удалёнка', label: 'Удалёнка' },
    { value: 'Гибрид', label: 'Гибрид' }
];

/**
 * Конфигурация валидации
 */
export const validationRules = {
    firstName: { required: true, minLength: 2 },
    lastName: { required: true, minLength: 2 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    telegram: { required: true, minLength: 3 },
    experienceYears: { required: true },
    workFormat: { required: true }
};

/**
 * Константы UI
 */
export const UI_CONSTANTS = {
    ANIMATION_DURATION: 300,
    Z_INDEX: {
        DROPDOWN: 1000,
        MODAL: 999999
    },
    BREAKPOINTS: {
        MOBILE: 768
    }
};
