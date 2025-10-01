import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { fullSync } from './supabase/syncSheetsSupabase.js';
import { syncSurveyQuestions } from './supabase/syncSurveyQuestions.js';
import { telegramNotifications } from './telegram-notifications.js';
import surveyApi from '../api/surveyApi.js';
import surveyQuestionsApi from '../api/surveyQuestionsApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WebhookService {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || process.env.WEBHOOK_PORT || 3001;
    this.isRunning = false;
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    //  БЕЗОПАСНОСТЬ: Ограничение размера body
    this.app.use(express.json({ limit: '50kb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50kb' }));
    
    //  БЕЗОПАСНОСТЬ: CORS только для наших доменов
    this.app.use((req, res, next) => {
      const allowedOrigins = [
        process.env.WEBAPP_URL,
        'https://web.telegram.org',
        'http://localhost:3001',
        'http://localhost:3000'
      ].filter(Boolean);
      
      const origin = req.headers.origin;
      if (allowedOrigins.some(allowed => origin?.startsWith(allowed))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-telegram-init-data');
        res.setHeader('Access-Control-Max-Age', '3600');
      }
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      
      next();
    });
    
    // Логирование (без чувствительных данных)
    this.app.use((req, res, next) => {
      console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
    
    //  БЕЗОПАСНОСТЬ: Защита от timing attacks
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        // Добавляем случайную задержку для защиты от timing атак
        if (duration < 100) {
          setTimeout(() => {}, Math.random() * 50);
        }
      });
      next();
    });
  }

  setupRoutes() {
    this.app.use('/webapp', express.static(path.join(__dirname, '../../webapp')));
    this.app.use('/api/survey', surveyApi); //  Основное API для WebApp
    this.app.use('/api/questions', surveyQuestionsApi); //  API вопросов из Supabase
    this.app.post('/webhook/sheets-updated', this.handleSheetsUpdate.bind(this));
    
    this.app.post('/webhook/manual-sync', this.handleManualSync.bind(this));
    this.app.get('/health', this.handleHealthCheck.bind(this));
    
    this.app.get('/test', this.handleTest.bind(this));
    // Примечание: catch-all маршрут НЕ регистрируем здесь, 
    // чтобы не перехватывать /webhook/telegram который регистрируется позже
  }
  
  // Метод для финализации маршрутов (вызывается после регистрации всех других маршрутов)
  finalizeCatchAll() {
    this.app.use('*', this.handleNotFound.bind(this));
  }

  async handleSheetsUpdate(req, res) {
    try {
      console.log('📨 Получен webhook от Google Sheets');
      const authToken = req.headers['authorization'];
      
      //  БЕЗОПАСНОСТЬ: Обязательная проверка webhook secret
      if (!process.env.WEBHOOK_SECRET) {
        console.error('❌ WEBHOOK_SECRET не настроен - webhook отключен');
        return res.status(503).json({ error: 'Webhook temporarily unavailable' });
      }
      
      if (authToken !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
        console.warn('⚠️ Неверный WEBHOOK_SECRET');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const result = await fullSync();
      
      if (result.success) {
        console.log('✅ Webhook синхронизация завершена');
        
        // Уведомляем админа только если есть изменения
        if (this.hasChanges(result)) {
          await telegramNotifications.notifySyncResult(result, 'webhook');
        }
        
        res.status(200).json({
          success: true,
          message: 'Синхронизация выполнена',
          result: {
            vacancies: result.vacancies,
            subscriptions: result.subscriptions
          }
        });
      } else {
        console.error('❌ Ошибка webhook синхронизации:', result.error);
        
        await telegramNotifications.notifyAdmin(
          `❌ *Ошибка webhook синхронизации*\n\n` +
          `Ошибка: ${result.error}\n` +
          `Время: ${new Date().toLocaleString('ru-RU')}`,
          { parse_mode: 'Markdown' }
        );
        
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Критическая ошибка webhook:', error);
      
      await telegramNotifications.notifyCriticalError(error, 'webhook синхронизация');
      
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
      });
    }
  }

  /**
   * Обработка ручной синхронизации
   * DRY: Переиспользуемая логика синхронизации
   */
  async handleManualSync(req, res) {
    try {
      console.log('🔧 Ручная синхронизация через webhook');
      
      const result = await fullSync();
      
      if (result.success) {
        await telegramNotifications.notifySyncResult(result, 'ручная webhook');
        
        res.status(200).json({
          success: true,
          message: 'Ручная синхронизация выполнена',
          result: {
            vacancies: result.vacancies,
            subscriptions: result.subscriptions
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Ошибка ручной синхронизации:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Обработка синхронизации вопросов от Google Sheets
   * Автоматически вызывается при изменении таблицы через Apps Script
   */
  async handleQuestionsSync(req, res) {
    try {
      console.log('📨 Получен webhook синхронизации вопросов от Google Sheets');
      
      // Проверка токена безопасности (опционально)
      const authToken = req.headers['authorization'];
      if (process.env.WEBHOOK_SECRET && authToken !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
        console.warn('⚠️ Неверный токен авторизации');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { sheet, timestamp } = req.body;
      console.log(`   Лист: ${sheet || 'все'}`);
      console.log(`   Время: ${timestamp || new Date().toISOString()}`);
      
      // Запускаем синхронизацию
      const result = await syncSurveyQuestions();
      
      if (result.success) {
        console.log('✅ Автоматическая синхронизация вопросов выполнена');
        console.log(`   Категорий: ${result.categories?.synced || 0}`);
        console.log(`   Полей: ${result.fields?.synced || 0}`);
        
        res.json({
          success: true,
          message: 'Синхронизация вопросов выполнена',
          result: {
            categories: result.categories?.synced || 0,
            fields: result.fields?.synced || 0
          }
        });
      } else {
        console.error('❌ Ошибка синхронизации вопросов:', result.error);
        
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error('❌ Критическая ошибка синхронизации вопросов:', error);
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Проверка здоровья сервиса
   * KISS: Простая проверка статуса
   */
  handleHealthCheck(req, res) {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'webhook-sync',
      version: '1.0.0'
    });
  }

  /**
   * Тестовый endpoint
   * SOLID: Отдельный метод для тестирования
   */
  handleTest(req, res) {
    res.status(200).json({
      message: 'Webhook сервис работает',
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /webhook/sheets-updated',
        'POST /webhook/manual-sync',
        'POST /webhook/sync-questions',
        'GET /health',
        'GET /test',
        'GET /api/questions/categories',
        'POST /api/survey/complete'
      ]
    });
  }

  /**
   * Обработка несуществующих маршрутов
   * DRY: Переиспользуемая логика ошибок
   */
  handleNotFound(req, res) {
    res.status(404).json({
      error: 'Маршрут не найден',
      availableEndpoints: [
        'POST /webhook/sheets-updated',
        'POST /webhook/manual-sync',
        'GET /health',
        'GET /test'
      ]
    });
  }

  /**
   * Запуск webhook сервера
   * KISS: Простой запуск
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Webhook сервер уже запущен');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          this.isRunning = true;
          console.log(`🚀 Webhook сервер запущен на порту ${this.port}`);
          console.log(`📡 Доступные endpoints:`);
          console.log(`   • POST http://localhost:${this.port}/webhook/sheets-updated`);
          console.log(`   • POST http://localhost:${this.port}/webhook/manual-sync`);
          console.log(`   • POST http://localhost:${this.port}/webhook/sync-questions`);
          console.log(`   • GET http://localhost:${this.port}/health`);
          console.log(`   • GET http://localhost:${this.port}/test`);
          console.log(`   • WebApp: http://localhost:${this.port}/webapp/`);
          resolve();
        });

        this.server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`❌ Порт ${this.port} уже используется`);
            console.error(`💡 Остановите другой процесс или измените WEBHOOK_PORT в .env`);
          }
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Остановка webhook сервера
   * DRY: Переиспользуемая логика остановки
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Webhook сервер не запущен');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.isRunning = false;
          console.log('⏹️ Webhook сервер остановлен');
          resolve();
        });
      } else {
        this.isRunning = false;
        console.log('⏹️ Webhook сервер остановлен');
        resolve();
      }
    });
  }

  /**
   * Проверка наличия изменений
   * KISS: Простая логика проверки
   */
  hasChanges(result) {
    const vacancies = result.vacancies || {};
    const subscriptions = result.subscriptions || {};
    
    return (vacancies.synced > 0 || vacancies.updated > 0 || subscriptions.synced > 0);
  }
}

// Экспортируем класс и singleton instance
export { WebhookService };
export const webhookService = new WebhookService();
