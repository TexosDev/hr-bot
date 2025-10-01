// Простое хранилище сессий в памяти
const sessions = new Map();

// Получение сессии пользователя
export function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {});
  }
  return sessions.get(userId);
}

// Сохранение сессии пользователя
export function setSession(userId, sessionData) {
  sessions.set(userId, { ...sessions.get(userId), ...sessionData });
}

// Очистка сессии пользователя
export function clearSession(userId) {
  sessions.delete(userId);
}

// Получение выбранной вакансии
export function getSelectedVacancy(userId) {
  const session = getSession(userId);
  return session.selectedVacancy || null;
}

// Сохранение выбранной вакансии
export function setSelectedVacancy(userId, vacancy) {
  setSession(userId, { selectedVacancy: vacancy });
}
