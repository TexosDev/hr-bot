import mammoth from 'mammoth';

// Парсинг PDF файла
export async function parsePDF(buffer) {
  try {
    // Временное решение: PDF файлы сохраняются в Drive, но текст не извлекается
    // В будущем можно интегрировать OCR или другую библиотеку для PDF
    console.log('PDF файл получен, текст будет извлечен позже');
    return { text: '' };
  } catch (error) {
    console.error('Ошибка парсинга PDF:', error);
    return { text: '' };
  }
}

// Парсинг DOCX файла
export async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value || '' };
  } catch (error) {
    console.error('Ошибка парсинга DOCX:', error);
    return { text: '' };
  }
}

// Парсинг TXT файла
export function parseTXT(buffer) {
  try {
    return { text: buffer.toString('utf8') };
  } catch (error) {
    console.error('Ошибка парсинга TXT:', error);
    return { text: '' };
  }
}

// Основная функция парсинга файла
export async function parseFile(buffer, fileName, mimeType) {
  const lowerFileName = fileName.toLowerCase();
  
  if (mimeType.includes('pdf') || lowerFileName.endsWith('.pdf')) {
    return await parsePDF(buffer);
  } else if (lowerFileName.endsWith('.docx')) {
    return await parseDOCX(buffer);
  } else if (lowerFileName.endsWith('.txt') || mimeType.includes('text/plain')) {
    return parseTXT(buffer);
  } else {
    console.warn(`Неподдерживаемый формат файла: ${fileName} (${mimeType})`);
    return { text: '' };
  }
}
