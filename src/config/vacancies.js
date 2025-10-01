// Список доступных вакансий
export const VACANCIES = [
  {
    id: 'frontend',
    title: 'Frontend Developer',
    description: 'React, Vue, JavaScript, TypeScript',
    emoji: ''
  },
  {
    id: 'backend',
    title: 'Backend Developer',
    description: 'Node.js, Python, PHP, Java',
    emoji: '⚙'
  },
  {
    id: 'fullstack',
    title: 'Fullstack Developer',
    description: 'Frontend + Backend разработка',
    emoji: ''
  },
  {
    id: 'mobile',
    title: 'Mobile Developer',
    description: 'React Native, Flutter, iOS, Android',
    emoji: ''
  },
  {
    id: 'devops',
    title: 'DevOps Engineer',
    description: 'Docker, Kubernetes, AWS, CI/CD',
    emoji: ''
  },
  {
    id: 'designer',
    title: 'UI/UX Designer',
    description: 'Figma, Adobe XD, Sketch, Prototyping',
    emoji: '�'
  },
  {
    id: 'qa',
    title: 'QA Engineer',
    description: 'Тестирование, автоматизация, Selenium',
    emoji: '🧪'
  },
  {
    id: 'other',
    title: 'Другая позиция',
    description: 'Не нашли подходящую? Выберите это',
    emoji: '�'
  }
];

// Создание клавиатуры с вакансиями
export function createVacancyKeyboard() {
  const keyboard = [];
  
  // Создаем ряды по 2 кнопки
  for (let i = 0; i < VACANCIES.length; i += 2) {
    const row = [];
    
    // Первая кнопка в ряду
    row.push({
      text: `${VACANCIES[i].emoji} ${VACANCIES[i].title}`,
      callback_data: `vacancy_${VACANCIES[i].id}`
    });
    
    // Вторая кнопка в ряду (если есть)
    if (i + 1 < VACANCIES.length) {
      row.push({
        text: `${VACANCIES[i + 1].emoji} ${VACANCIES[i + 1].title}`,
        callback_data: `vacancy_${VACANCIES[i + 1].id}`
      });
    }
    
    keyboard.push(row);
  }
  
  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

// Получение вакансии по ID
export function getVacancyById(id) {
  return VACANCIES.find(vacancy => vacancy.id === id);
}
