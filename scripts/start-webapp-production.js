#!/usr/bin/env node

/**
 * Production WebApp сервер для Railway
 * Работает независимо от Telegram бота
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import surveyApi from '../src/api/surveyApi.js';
import surveyQuestionsApi from '../src/api/surveyQuestionsApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

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

// API endpoints
app.use('/api/survey', surveyApi);
app.use('/api/questions', surveyQuestionsApi);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'webapp-server',
    version: '1.0.0'
  });
});

// Главная страница - редирект на webapp
app.get('/', (req, res) => {
  res.redirect('/webapp/index.html');
});

// Информация об API
app.get('/api', (req, res) => {
  res.json({
    message: 'WebApp API',
    endpoints: [
      'GET /webapp/index.html - WebApp интерфейс',
      'POST /api/survey/complete - Завершение опроса',
      'GET /api/questions/categories - Категории вопросов',
      'GET /health - Проверка здоровья'
    ]
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    path: req.path,
    availableEndpoints: [
      'GET /',
      'GET /webapp/index.html',
      'POST /api/survey/complete',
      'GET /api/questions/categories',
      'GET /health'
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
  console.log('🚀 WebApp Production сервер запущен!');
  console.log(`📱 Порт: ${port}`);
  console.log(`🌐 Главная: http://localhost:${port}/`);
  console.log(`📋 WebApp: http://localhost:${port}/webapp/index.html`);
  console.log(`❤️  Health: http://localhost:${port}/health`);
  console.log(`🔗 API: http://localhost:${port}/api`);
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

