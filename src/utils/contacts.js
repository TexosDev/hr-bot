// Парсинг контактной информации из текста
export function parseContacts(text = '') {
  const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || '';
  const phone = (text.match(/(\+?\d[\d\s\-\(\)]{7,}\d)/) || [])[0] || '';
  const fullNameGuess = (text.match(/(?:Name|Имя)[:\s]+([^\n\r]+)/i) || [])[1] || '';
  
  return { email, phone, fullNameGuess };
}
