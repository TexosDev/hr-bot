import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Инициализация Google Drive API
export function createDriveService(auth) {
  return google.drive({ version: 'v3', auth });
}

// Загрузка файла в Google Drive
export async function uploadFileToDrive(driveService, fileBuffer, fileName, mimeType, folderId) {
  let tempFilePath = null;
  
  try {
    // Создаем временный файл
    tempFilePath = path.join(process.cwd(), `temp_${Date.now()}_${fileName}`);
    fs.writeFileSync(tempFilePath, fileBuffer);
    
    // Создаем поток из файла
    const fileStream = fs.createReadStream(tempFilePath);
    
    // Загружаем файл в Shared Drive
    const driveRes = await driveService.files.create({
      requestBody: {
        name: fileName || `resume_${Date.now()}`,
        parents: [folderId]
      },
      media: {
        mimeType: mimeType || 'application/octet-stream',
        body: fileStream
      },
      fields: 'id',
      supportsAllDrives: true // Важно для Shared Drive
    });
    
    const fileId = driveRes.data.id;
    
    // Предоставление доступа по ссылке
    await driveService.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' }
    });
    
    return `https://drive.google.com/file/d/${fileId}/view`;
    
  } catch (error) {
    console.error('Ошибка загрузки в Drive:', error);
    throw new Error('Не удалось загрузить файл в Google Drive');
  } finally {
    // Удаляем временный файл
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('Не удалось удалить временный файл:', cleanupError);
      }
    }
  }
}
