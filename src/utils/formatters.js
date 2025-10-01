/**
 * Утилиты для форматирования
 * Следует принципам SOLID, DRY, KISS
 */

/**
 * Форматирование сообщения об ошибке
 * DRY: Переиспользуемая логика
 */
export function formatErrorMessage(operation, error) {
  return ` Ошибка ${operation}: ${error.message || error}`;
}

/**
 * Форматирование сообщения об успехе
 * DRY: Переиспользуемая логика
 */
export function formatSuccessMessage(operation, details = '') {
  return ` ${operation}${details ? `: ${details}` : ''}`;
}

/**
 * Форматирование информации о вакансии
 * DRY: Переиспользуемая логика
 */
export function formatVacancyInfo(vacancy) {
  return ` **${vacancy.emoji} ${vacancy.title}**\n\n` +
         ` ${vacancy.description}\n\n` +
         ` Уровень: ${vacancy.level || 'Любой'}\n` +
         ` Зарплата: ${vacancy.salary || 'По договоренности'}`;
}

/**
 * Форматирование информации о пользователе
 * DRY: Переиспользуемая логика
 */
export function formatUserInfo(user) {
  const name = user.first_name || user.username || 'Пользователь';
  const username = user.username ? ` (@${user.username})` : '';
  return `${name}${username}`;
}

/**
 * Форматирование размера файла
 * DRY: Переиспользуемая логика
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Форматирование времени
 * DRY: Переиспользуемая логика
 */
export function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Экранирование специальных символов для Markdown
 * DRY: Переиспользуемая логика
 */
export function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Экранирование специальных символов для HTML
 * DRY: Переиспользуемая логика
 */
export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (match) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
}
