/**
 * Главный модуль приложения
 * @module main
 */

import { appState } from './state.js';
import { initUI, renderCategories, showError, showSuccess } from './ui.js';
import { initValidation } from './validation.js';
import { initNavigation, handleKeyboardNavigation, addProgressIndicators } from './navigation.js';

/**
 * Инициализация приложения
 */
async function initApp() {
    try {
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initApp);
            return;
        }

        console.log('🚀 Инициализация WebApp...');

        // Скрываем индикатор загрузки на всякий случай
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }

        // Инициализируем UI компоненты
        initUI();

        // Инициализируем валидацию
        initValidation();

        // Инициализируем навигацию
        initNavigation();

        // Добавляем индикаторы прогресса
        addProgressIndicators();

        // Добавляем обработку клавиш
        handleKeyboardNavigation();

        // Загружаем категории
        renderCategories();

        // Подключаемся к Telegram WebApp API если доступно
        initTelegramWebApp();

        // Добавляем event delegation для элементов без inline handlers
        await initEventDelegation();

        console.log('✅ WebApp инициализирован успешно');

    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showError('Произошла ошибка при загрузке приложения');
        
        // Скрываем индикатор загрузки в случае ошибки
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

/**
 * Инициализация event delegation для всех интерактивных элементов
 */
async function initEventDelegation() {
    // Импортируем нужные функции
    const { selectExperience, selectOption, handleFileSelect, removeFile, toggleDropdown } = await import('./ui.js');
    const { nextStep, prevStep, returnToBot } = await import('./navigation.js');
    
    // Experience tags
    document.addEventListener('click', (e) => {
        const experienceTag = e.target.closest('.experience-tag');
        if (experienceTag) {
            selectExperience(experienceTag.dataset.value);
        }
    });

    // Dropdown items
    document.addEventListener('click', (e) => {
        const dropdownItem = e.target.closest('.dropdown-item');
        if (dropdownItem) {
            const field = dropdownItem.dataset.field;
            const value = dropdownItem.dataset.value;
            if (field && value) {
                selectOption(field, value, value, dropdownItem);
            }
        }
    });

    // Dropdown triggers
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.dropdown-trigger');
        if (trigger) {
            const dropdown = trigger.closest('.custom-dropdown');
            if (dropdown) {
                toggleDropdown(dropdown.id);
            }
        }
    });

    // File upload
    const fileInput = document.getElementById('resumeFile');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFileSelect(e.target);
        });
    }

    // Remove file button
    const removeFileBtn = document.getElementById('removeFileBtn');
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', removeFile);
    }

    // Navigation buttons
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextStep);
    }

    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', prevStep);
    }

    const returnBtn = document.getElementById('returnBtn');
    if (returnBtn) {
        returnBtn.addEventListener('click', returnToBot);
    }

    // Form inputs - автосохранение при изменении
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', (e) => {
            appState.updateFormData({
                [e.target.id]: e.target.value
            });
        });
    });
}

/**
 * Инициализация Telegram WebApp API
 */
function initTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;

        console.log('📱 Подключено к Telegram WebApp');

        // Настраиваем WebApp
        tg.ready();
        tg.expand(); // Разворачиваем на весь экран

        // MainButton - используем для навигации
        tg.MainButton.text = 'Далее';
        tg.MainButton.color = '#0088cc';
        tg.MainButton.show();
        tg.MainButton.onClick(() => {
            import('./navigation.js').then(({ nextStep }) => {
                nextStep();
            });
        });

        // Обновляем MainButton при изменении шага
        appState.subscribe((state) => {
            if (state.currentStep === state.totalSteps) {
                tg.MainButton.text = '✅ Завершить опрос';
            } else {
                tg.MainButton.text = `Далее (${state.currentStep}/${state.totalSteps})`;
            }

            // Показываем/скрываем BackButton
            if (state.currentStep > 1) {
                tg.BackButton.show();
            } else {
                tg.BackButton.hide();
            }
        });

        // Добавляем кнопку "Назад"
        tg.BackButton.onClick(() => {
            const state = appState.getState();
            if (state.currentStep > 1) {
                import('./navigation.js').then(({ prevStep }) => {
                    prevStep();
                });
            } else {
                tg.close();
            }
        });

        // Обрабатываем изменение viewport
        tg.onEvent('viewportChanged', () => {
            updateViewport();
        });

        // Настраиваем цвета темы
        if (tg.themeParams) {
            applyTelegramTheme(tg.themeParams);
        }

        console.log('✅ Telegram WebApp API настроен');
    } else {
        console.log('⚠️ Не запущено в Telegram, используется браузерный режим');
    }
}

/**
 * Применить тему Telegram
 * @param {Object} themeParams - Параметры темы
 */
function applyTelegramTheme(themeParams) {
    const root = document.documentElement;

    // Применяем цвета темы если они доступны
    if (themeParams.bg_color) {
        root.style.setProperty('--tg-bg-color', themeParams.bg_color);
    }
    if (themeParams.text_color) {
        root.style.setProperty('--tg-text-color', themeParams.text_color);
    }
    if (themeParams.button_color) {
        root.style.setProperty('--tg-button-color', themeParams.button_color);
    }
    if (themeParams.button_text_color) {
        root.style.setProperty('--tg-button-text-color', themeParams.button_text_color);
    }
}

/**
 * Обновить viewport для мобильных устройств
 */
function updateViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && window.Telegram && window.Telegram.WebApp) {
        const WebApp = window.Telegram.WebApp;

        // Настраиваем viewport для Telegram WebApp
        viewport.setAttribute('content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );

        // Добавляем padding для безопасных зон iOS
        if (WebApp.safeAreaInset) {
            const style = document.createElement('style');
            style.textContent = `
                body {
                    padding-top: ${WebApp.safeAreaInset.top}px;
                    padding-bottom: ${WebApp.safeAreaInset.bottom}px;
                    padding-left: ${WebApp.safeAreaInset.left}px;
                    padding-right: ${WebApp.safeAreaInset.right}px;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

/**
 * Обработка ошибок приложения
 */
window.addEventListener('error', (event) => {
    console.error('🚨 Глобальная ошибка:', event.error);
    showError('Произошла неожиданная ошибка. Перезагрузите страницу.');
});

/**
 * Обработка необработанных промисов
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Необработанная ошибка промиса:', event.reason);
    showError('Произошла ошибка сети. Проверьте подключение и попробуйте снова.');
});

/**
 * Проверка поддержки браузера
 */
function checkBrowserSupport() {
    // Проверяем поддержку современных фич
    const requiredFeatures = [
        'fetch',
        'Promise',
        'Map',
        'Set',
        'Array.prototype.includes'
    ];

    const unsupported = requiredFeatures.filter(feature => {
        if (feature.includes('.')) {
            const [obj, method] = feature.split('.');
            return !window[obj] || !window[obj][method];
        }
        return !window[feature];
    });

    if (unsupported.length > 0) {
        showError(`Ваш браузер не поддерживает некоторые функции: ${unsupported.join(', ')}`);
        return false;
    }

    return true;
}

/**
 * Загрузка скриптов с зависимостями
 */
async function loadDependencies() {
    // Здесь можно добавить загрузку внешних библиотек если нужно
    // Например: await loadScript('https://cdn.example.com/library.js');

    return true;
}

/**
 * Загрузить внешний скрипт
 * @param {string} src - URL скрипта
 * @returns {Promise} Промис загрузки
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Запускаем приложение
initApp();

// Экспортируем функции для глобального доступа (если нужно)
window.WebApp = {
    initApp,
    appState,
    showError,
    showSuccess
};
