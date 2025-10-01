import 'dotenv/config';
import { google } from 'googleapis';

// Инициализация Google API
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.GOOGLE_VACANCIES_SHEET_ID || process.env.GOOGLE_SHEET_ID;

async function updateVacanciesWithRequirements() {
  try {
    console.log('📝 Обновление вакансий с требованиями и преимуществами...');
    
    // Данные для обновления (A:I - 9 колонок)
    const vacancyData = [
      // Заголовки
      ['Название', 'Описание', 'Эмодзи', 'Категория', 'Ссылка', 'Уровень', 'Зарплата', 'Требования', 'Преимущества'],
      
      // Вакансии
      [
        'Frontend Developer',
        'Разработка пользовательских интерфейсов на React, Vue, JavaScript',
        '💻',
        'IT/Разработка',
        'https://example.com/frontend',
        'Middle',
        '150-200k',
        'Опыт разработки от 2 лет\nЗнание React/Vue\nОпыт работы с Git\nПонимание принципов ООП',
        'Удаленная работа\nГибкий график\nОбучение и развитие\nСовременные технологии'
      ],
      [
        'Backend Developer',
        'Разработка серверной части приложений на Node.js, Python',
        '⚙️',
        'IT/Разработка',
        'https://example.com/backend',
        'Middle',
        '150-200k',
        'Опыт разработки от 2 лет\nЗнание Node.js/Python\nОпыт работы с базами данных\nПонимание REST API',
        'Удаленная работа\nГибкий график\nОбучение и развитие\nИнтересные проекты'
      ],
      [
        'UI/UX Designer',
        'Создание пользовательских интерфейсов и пользовательского опыта',
        '🎨',
        'Дизайн',
        'https://example.com/designer',
        'Middle',
        '120-180k',
        'Портфолио с примерами работ\nЗнание Figma, Adobe XD\nПонимание принципов UX/UI\nКреативность',
        'Креативная среда\nСовременные инструменты\nВозможность роста\nИнтересные проекты'
      ],
      [
        'Product Manager',
        'Управление продуктом, планирование, работа с командой',
        '📈',
        'Менеджмент',
        'https://example.com/pm',
        'Senior',
        '200-300k',
        'Опыт управления продуктом от 3 лет\nНавыки планирования и организации\nОпыт работы с Agile/Scrum\nЛидерские качества',
        'Высокая ответственность\nВозможность влиять на продукт\nРабота с командой\nКарьерный рост'
      ],
      [
        'Marketing Manager',
        'Развитие маркетинговых стратегий, работа с контентом',
        '📢',
        'Маркетинг',
        'https://example.com/marketing',
        'Middle',
        '100-150k',
        'Опыт в digital-маркетинге от 2 лет\nЗнание SMM и контент-маркетинга\nОпыт работы с аналитикой\nКреативность',
        'Креативная работа\nРабота с данными\nРазнообразные задачи\nВозможность экспериментов'
      ],
      [
        'QA Engineer',
        'Тестирование приложений, автоматизация тестирования',
        '🧪',
        'QA/Тестирование',
        'https://example.com/qa',
        'Junior',
        '80-120k',
        'Опыт тестирования от 1 года\nЗнание методологий тестирования\nОпыт работы с баг-трекерами\nВнимательность к деталям',
        'Детальная работа\nПостоянное обучение\nРабота с новыми технологиями\nВажная роль в проекте'
      ]
    ];
    
    // Обновляем данные в Google Sheets
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1:I7', // Обновляем диапазон A1:I7 (заголовок + 6 вакансий)
      valueInputOption: 'RAW',
      resource: {
        values: vacancyData
      }
    });
    
    console.log('✅ Вакансии обновлены с требованиями и преимуществами');
    console.log('📋 Структура таблицы:');
    console.log('   A - Название');
    console.log('   B - Описание');
    console.log('   C - Эмодзи');
    console.log('   D - Категория');
    console.log('   E - Ссылка');
    console.log('   F - Уровень');
    console.log('   G - Зарплата');
    console.log('   H - Требования (через \\n)');
    console.log('   I - Преимущества (через \\n)');
    
  } catch (error) {
    console.error('❌ Ошибка обновления вакансий:', error);
  }
}

// Запуск обновления
updateVacanciesWithRequirements();
