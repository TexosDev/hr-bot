/**
 * Валидация форм
 * @module validation
 */

import { appState } from './state.js';
import { showError } from './ui.js';

/**
 * Валидация шага 1 (Основная информация)
 * @returns {boolean} Результат валидации
 */
export function validateStep1() {
    const state = appState.getState();
    const formData = state.formData;
    const errors = {};

    // Валидация имени
    if (!formData.firstName || formData.firstName.trim().length < 2) {
        errors.firstName = 'Имя должно содержать минимум 2 символа';
    }

    // Валидация фамилии
    if (!formData.lastName || formData.lastName.trim().length < 2) {
        errors.lastName = 'Фамилия должна содержать минимум 2 символа';
    }

    // Валидация email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailPattern.test(formData.email)) {
        errors.email = 'Введите корректный email адрес';
    }

    // Валидация Telegram
    if (!formData.telegram || formData.telegram.trim().length < 3) {
        errors.telegram = 'Введите ваш Telegram username';
    }

    // Устанавливаем ошибки в состояние
    appState.setErrors(errors);

    // Показываем первую ошибку пользователю
    const firstError = Object.values(errors)[0];
    if (firstError) {
        showError(firstError);
    }

    return Object.keys(errors).length === 0;
}

/**
 * Валидация шага 2 (Специализация и навыки)
 * @returns {boolean} Результат валидации
 */
export function validateStep2() {
    const state = appState.getState();
    const errors = {};

    // Валидация категории
    if (!state.selectedCategory) {
        errors.category = 'Выберите специализацию';
    }

    // Валидация навыков
    if (state.selectedSkills.length === 0) {
        errors.skills = 'Выберите хотя бы один навык';
    }

    // Устанавливаем ошибки в состояние
    appState.setErrors(errors);

    // Показываем первую ошибку пользователю
    const firstError = Object.values(errors)[0];
    if (firstError) {
        showError(firstError);
    }

    return Object.keys(errors).length === 0;
}

/**
 * Валидация шага 3 (Опыт и предпочтения)
 * @returns {boolean} Результат валидации
 */
export function validateStep3() {
    const state = appState.getState();
    const formData = state.formData;
    const errors = {};

    // Валидация опыта работы
    if (!formData.experienceYears) {
        errors.experienceYears = 'Выберите опыт работы';
    }

    // Валидация формата работы
    if (!formData.workFormat) {
        errors.workFormat = 'Выберите формат работы';
    }

    // Устанавливаем ошибки в состояние
    appState.setErrors(errors);

    // Показываем первую ошибку пользователю
    const firstError = Object.values(errors)[0];
    if (firstError) {
        showError(firstError);
    }

    return Object.keys(errors).length === 0;
}

/**
 * Валидация шага 4 (Резюме)
 * @returns {boolean} Результат валидации
 */
export function validateStep4() {
    // Шаг 4 не требует обязательных полей, но можно добавить валидацию ссылок
    const state = appState.getState();
    const formData = state.formData;
    const errors = {};

    // Валидация ссылки на профиль (если указана)
    if (formData.profileLink && formData.profileLink.trim()) {
        try {
            new URL(formData.profileLink);
        } catch {
            errors.profileLink = 'Введите корректную ссылку';
        }
    }

    // Устанавливаем ошибки в состояние
    appState.setErrors(errors);

    // Показываем первую ошибку пользователю
    const firstError = Object.values(errors)[0];
    if (firstError) {
        showError(firstError);
    }

    return Object.keys(errors).length === 0;
}

/**
 * Валидация всей формы перед отправкой
 * @returns {boolean} Результат валидации
 */
export function validateForm() {
    const state = appState.getState();
    const currentStep = state.currentStep;

    // Валидируем текущий шаг
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        case 4:
            return validateStep4();
        default:
            return true;
    }
}

/**
 * Очистить ошибки валидации
 */
export function clearValidationErrors() {
    appState.clearErrors();
}

/**
 * Показать ошибки валидации в форме
 */
export function displayValidationErrors() {
    const errors = appState.getState().errors;

    // Очищаем предыдущие ошибки
    document.querySelectorAll('.field-error').forEach(error => error.remove());

    // Показываем новые ошибки
    Object.entries(errors).forEach(([field, message]) => {
        const input = document.getElementById(field);
        if (input) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = message;
            errorDiv.style.cssText = `
                color: #ff4444;
                font-size: 12px;
                margin-top: 4px;
                margin-bottom: 8px;
            `;

            // Вставляем ошибку после поля
            input.parentNode.insertBefore(errorDiv, input.nextSibling);

            // Добавляем красную рамку полю
            input.style.borderColor = '#ff4444';
        }
    });
}

/**
 * Сбросить стили ошибок
 */
export function resetFieldStyles() {
    document.querySelectorAll('.form-input, .form-select').forEach(input => {
        input.style.borderColor = '';
    });

    document.querySelectorAll('.field-error').forEach(error => error.remove());
}

/**
 * Дебounced валидация для реального времени
 * @param {Function} validator - Функция валидации
 * @param {number} delay - Задержка в мс
 * @returns {Function} Дебounced функция
 */
export function debounceValidation(validator, delay = 300) {
    let timeoutId;

    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => validator.apply(this, args), delay);
    };
}

/**
 * Валидация email в реальном времени (визуально, без алерта)
 */
export function validateEmailRealTime() {
    const emailInput = document.getElementById('email');
    if (!emailInput) return;

    const debouncedValidation = debounceValidation(() => {
        const email = emailInput.value;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Убираем агрессивную валидацию - не показываем алерт при вводе
        // Валидация будет при переходе на следующий шаг
        if (email && !emailPattern.test(email)) {
            emailInput.style.borderColor = '#ff9800'; // Оранжевая рамка (предупреждение)
        } else if (email) {
            emailInput.style.borderColor = '#4CAF50'; // Зелёная рамка (валидно)
        }
    });

    emailInput.addEventListener('input', debouncedValidation);
}

/**
 * Инициализация валидации
 */
export function initValidation() {
    // Добавляем валидацию email в реальном времени
    validateEmailRealTime();

    // Сбрасываем стили ошибок при фокусе на поле
    document.querySelectorAll('.form-input, .form-select').forEach(input => {
        input.addEventListener('focus', () => {
            input.style.borderColor = '';
            const error = input.parentNode.querySelector('.field-error');
            if (error) error.remove();
        });
    });
}
