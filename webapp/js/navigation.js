/**
 * Навигация по шагам формы
 * @module navigation
 */

import { appState } from './state.js';
import { validateForm, clearValidationErrors, resetFieldStyles } from './validation.js';
import { updateStepDisplay, showLoading } from './ui.js';

/**
 * Перейти к следующему шагу
 */
export function nextStep() {
    const state = appState.getState();

    // Валидируем текущий шаг перед переходом
    if (!validateForm()) {
        return;
    }

    // Очищаем ошибки валидации
    clearValidationErrors();

    // Сбрасываем стили ошибок
    resetFieldStyles();

    // Переходим к следующему шагу
    if (state.currentStep < state.totalSteps) {
        appState.nextStep();
        updateStepDisplay();

        // Прокручиваем к началу формы
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // Последний шаг - отправляем форму
        submitForm();
    }
}

/**
 * Перейти к предыдущему шагу
 */
export function prevStep() {
    const state = appState.getState();

    // Очищаем ошибки валидации
    clearValidationErrors();

    // Сбрасываем стили ошибок
    resetFieldStyles();

    // Переходим к предыдущему шагу
    if (state.currentStep > 1) {
        appState.prevStep();
        updateStepDisplay();

        // Прокручиваем к началу формы
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Перейти к конкретному шагу
 * @param {number} step - Номер шага
 */
export function goToStep(step) {
    const state = appState.getState();

    // Очищаем ошибки валидации
    clearValidationErrors();

    // Сбрасываем стили ошибок
    resetFieldStyles();

    // Переходим к указанному шагу
    if (step >= 1 && step <= state.totalSteps) {
        appState.goToStep(step);
        updateStepDisplay();

        // Прокручиваем к началу формы
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Обновить отображение текущего шага
 */
export function updateStep() {
    updateStepDisplay();

    // Обновляем данные формы из полей ввода
    syncFormDataWithInputs();
}

/**
 * Синхронизировать данные формы с полями ввода
 */
export function syncFormDataWithInputs() {
    const state = appState.getState();
    const formData = state.formData;

    // Обновляем поля ввода из состояния
    Object.entries(formData).forEach(([field, value]) => {
        const input = document.getElementById(field);
        if (input && input.type !== 'file') {
            input.value = value;
        }
    });

    // Обновляем dropdown'ы
    if (formData.workFormat) {
        const workFormatText = document.getElementById('workFormatText');
        if (workFormatText) {
            workFormatText.textContent = formData.workFormat;
        }
    }
}

/**
 * Отправить форму
 */
export async function submitForm() {
    console.log('🚀 Начинаем отправку формы...');

    // Импортируем showSuccess
    const { showSuccess, showError: showErrorUI } = await import('./ui.js');

    const state = appState.getState();

    // Проверяем финальную валидацию
    if (!validateForm()) {
        console.log('❌ Валидация не пройдена, отправка отменена');
        return;
    }

    // Проверяем наличие интернета
    if (!navigator.onLine) {
        showErrorUI('⚠️ Нет подключения к интернету. Проверьте соединение и попробуйте снова.');
        console.warn('⚠️ Попытка отправки без интернета');
        return;
    }

    // Показываем состояние загрузки
    showLoading(true);
    appState.setLoading(true);

    console.log('⏳ Показываем индикатор загрузки');

    try {
        // Получаем данные для отправки
        const formData = appState.getFormDataForSubmit();

        // Добавляем файл если он загружен
        if (state.uploadedFile) {
            formData.resumeFile = state.uploadedFile;
        }

        // Логируем данные для отладки
        console.log('📋 Данные формы для отправки:', formData);
        console.log('🔍 Проверка валидации пройдена успешно');

        // Определяем URL для отправки
        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/survey/complete`;

        console.log('🚀 Отправляем данные на:', apiUrl);

        // Отправляем данные на сервер с timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд timeout

        //  БЕЗОПАСНОСТЬ: Добавляем Telegram initData для валидации на сервере
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Получаем initData из Telegram WebApp API если доступно
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
            console.log('🔐 Добавлен Telegram auth header для валидации');
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(formData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Обработка различных статусов
        if (!response.ok) {
            if (response.status === 400) {
                throw new Error('Проверьте правильность заполнения всех полей');
            }
            if (response.status === 500) {
                throw new Error('Сервер временно недоступен. Попробуйте через минуту');
            }
            if (response.status === 503) {
                throw new Error('Сервис временно недоступен. Попробуйте позже');
            }
            throw new Error(`Ошибка отправки (код ${response.status})`);
        }

        const result = await response.json();
        console.log('✅ Ответ сервера:', result);

        // Сохраняем копию в localStorage на случай проблем
        localStorage.setItem('lastSubmission', JSON.stringify({
            formData,
            timestamp: new Date().toISOString(),
            success: true
        }));

        // Очищаем прогресс формы после успешной отправки
        appState.reset();

        // Показываем сообщение об успехе
        showSuccess('✅ Форма успешно отправлена! Спасибо за участие.');

        // Перенаправляем в бота через 2 секунды
        setTimeout(() => {
            returnToBot();
        }, 2000);

    } catch (error) {
        console.error('❌ Ошибка отправки формы:', error);
        
        // Сохраняем данные формы для повторной попытки
        const formData = appState.getFormDataForSubmit();
        localStorage.setItem('lastSubmission', JSON.stringify({
            formData,
            timestamp: new Date().toISOString(),
            error: error.message
        }));

        // Показываем понятную ошибку пользователю
        if (error.name === 'AbortError') {
            showErrorUI('⏱️ Превышено время ожидания. Проверьте соединение и попробуйте снова.');
        } else {
            showErrorUI(error.message || 'Произошла ошибка при отправке формы. Попробуйте позже.');
        }
    } finally {
        // Скрываем состояние загрузки
        console.log('🔄 Скрываем индикатор загрузки');
        showLoading(false);
        appState.setLoading(false);
    }
}

/**
 * Вернуться в Telegram бота
 */
export function returnToBot() {
    // Закрываем WebApp если мы в Telegram
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.close();
    } else {
        // Если не в Telegram, показываем сообщение
        alert('Форма отправлена! Свяжитесь с нами для получения вакансий.');
    }
}

/**
 * Инициализация навигации
 */
export function initNavigation() {
    // Подписываемся на изменения состояния для обновления UI
    appState.subscribe((state) => {
        if (state.currentStep !== undefined) {
            updateStepDisplay();
        }
    });

    // Инициализируем отображение
    updateStep();
}

/**
 * Обработка клавиш для навигации
 */
export function handleKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const state = appState.getState();

        // Enter для перехода к следующему шагу (кроме последнего)
        if (e.key === 'Enter' && !e.shiftKey && state.currentStep < state.totalSteps) {
            e.preventDefault();
            nextStep();
        }

        // Shift + Enter для перехода к предыдущему шагу
        if (e.key === 'Enter' && e.shiftKey && state.currentStep > 1) {
            e.preventDefault();
            prevStep();
        }

        // Escape для закрытия dropdown'ов
        if (e.key === 'Escape') {
            // Импортируем функцию закрытия dropdown'ов
            import('./ui.js').then(({ closeAllDropdowns }) => {
                closeAllDropdowns();
            });
        }
    });
}

/**
 * Добавить индикаторы прогресса
 */
export function addProgressIndicators() {
    const progressContainer = document.querySelector('.progress-indicators');
    if (!progressContainer) return;

    const state = appState.getState();

    progressContainer.innerHTML = '';

    for (let i = 1; i <= state.totalSteps; i++) {
        const indicator = document.createElement('div');
        indicator.className = `step-indicator ${i === state.currentStep ? 'active' : ''}`;
        indicator.onclick = () => goToStep(i);

        const circle = document.createElement('div');
        circle.className = 'step-circle';
        circle.textContent = i;

        indicator.appendChild(circle);
        progressContainer.appendChild(indicator);
    }
}

/**
 * Анимация перехода между шагами
 */
export function animateStepTransition() {
    const currentStepElement = document.querySelector('.step:not([style*="display: none"])');
    if (currentStepElement) {
        currentStepElement.style.opacity = '0';
        currentStepElement.style.transform = 'translateY(20px)';

        setTimeout(() => {
            currentStepElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            currentStepElement.style.opacity = '1';
            currentStepElement.style.transform = 'translateY(0)';
        }, 50);
    }
}
