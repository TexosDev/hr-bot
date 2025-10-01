#!/usr/bin/env node

/**
 * Простой HTTP сервер для WebApp
 * Для локальной разработки и тестирования
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.WEBAPP_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Статические файлы WebApp
app.use('/webapp', express.static(path.join(__dirname, '../webapp')));

// API для опросов (упрощенная версия)
app.post('/api/survey/complete', async (req, res) => {
  try {
    const { role, user, completed_at } = req.body;
    
    console.log('📝 Получены данные опроса:', {
      role,
      user: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
      completed_at
    });
    
    // Здесь можно добавить сохранение в базу данных
    // Пока просто логируем
    
    res.json({
      success: true,
      message: 'Опрос успешно завершен',
      data: {
        role,
        user_id: user?.id,
        completed_at
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка обработки опроса:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Проверка здоровья
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'webapp-server',
    version: '1.0.0'
  });
});

// Главная страница
app.get('/', (req, res) => {
  res.json({
    message: 'WebApp сервер работает',
    endpoints: [
      'GET /webapp/simple.html - WebApp интерфейс',
      'POST /api/survey/complete - Завершение опроса',
      'GET /health - Проверка здоровья'
    ]
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: err.message
  });
});

// Запуск сервера
app.listen(port, () => {
  console.log('🚀 WebApp сервер запущен!');
  console.log(`📱 WebApp доступен по адресу: http://localhost:${port}/webapp/simple.html`);
  console.log(`🔗 API доступен по адресу: http://localhost:${port}/api/survey/complete`);
  console.log(`❤️  Проверка здоровья: http://localhost:${port}/health`);
  console.log('\n💡 Для использования в Telegram:');
  console.log('1. Установите ngrok: npm install -g ngrok');
  console.log('2. Запустите туннель: ngrok http 3002');
  console.log('3. Скопируйте HTTPS URL и обновите WEBAPP_URL в .env');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️ Остановка WebApp сервера...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️ Остановка WebApp сервера...');
  process.exit(0);
});
