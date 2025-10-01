/**
 * Утилиты для валидации
 * Следует принципам SOLID, DRY, KISS
 */

/**
 * Проверка, что сообщение из личного чата
 * DRY: Убираем дублирование проверки
 */
export function isPrivateChat(ctx) {
  return ctx.chat.type === 'private';
}

/**
 * Проверка прав админа
 * DRY: Убираем дублирование проверки
 */
export function isAdmin(ctx) {
  const adminId = parseInt(process.env.ADMIN_CHAT_ID);
  return ctx.from.id === adminId;
}

/**
 * Проверка валидности ID вакансии
 * DRY: Переиспользуемая логика
 */
export function isValidVacancyId(vacancyId) {
  return vacancyId && vacancyId.length > 0;
}

/**
 * Проверка валидности email
 * DRY: Переиспользуемая логика
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Проверка валидности телефона
 * DRY: Переиспользуемая логика
 */
export function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Проверка валидности файла
 * DRY: Переиспользуемая логика
 */
export function isValidFile(file) {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  return allowedTypes.includes(file.mime_type) && file.file_size <= maxSize;
}
