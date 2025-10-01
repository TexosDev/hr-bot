/**
 * Управление состоянием приложения
 * @module state
 */

import { validationRules } from './config.js';

/**
 * Глобальное состояние приложения
 */
class AppState {
    constructor() {
        // Пытаемся восстановить сохраненное состояние
        const saved = this._loadFromStorage();
        
        this._state = saved || {
            currentStep: 1,
            totalSteps: 4,
            selectedCategory: null,
            selectedSkills: [],
            formData: {
                firstName: '',
                lastName: '',
                email: '',
                telegram: '',
                experienceYears: '',
                workFormat: '',
                geoPreference: '',
                salaryExpectation: '',
                profileLink: ''
            },
            uploadedFile: null,
            errors: {},
            isLoading: false
        };
    }

    /**
     * Загрузить состояние из localStorage
     */
    _loadFromStorage() {
        try {
            const saved = localStorage.getItem('formProgress');
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('✅ Восстановлено состояние из localStorage');
                return parsed;
            }
        } catch (error) {
            console.warn('⚠️ Ошибка восстановления состояния:', error);
        }
        return null;
    }

    /**
     * Сохранить состояние в localStorage
     */
    _saveToStorage() {
        try {
            const toSave = {
                ...this._state,
                uploadedFile: null, // Файлы не сохраняем в localStorage
                errors: {}, // Ошибки не сохраняем
                isLoading: false
            };
            localStorage.setItem('formProgress', JSON.stringify(toSave));
        } catch (error) {
            console.warn('⚠️ Ошибка сохранения состояния:', error);
        }
    }

    /**
     * Получить текущее состояние
     */
    getState() {
        return { ...this._state };
    }

    /**
     * Обновить состояние
     * @param {Object} updates - Обновления состояния
     */
    update(updates) {
        this._state = { ...this._state, ...updates };

        // Обновляем formData если переданы данные формы
        if (updates.formData) {
            this._state.formData = { ...this._state.formData, ...updates.formData };
        }

        // Сохраняем состояние
        this._saveToStorage();

        // Уведомляем слушателей об изменениях
        this._notifyListeners();
    }

    /**
     * Обновить данные формы
     * @param {Object} formData - Данные формы
     */
    updateFormData(formData) {
        this._state.formData = { ...this._state.formData, ...formData };
        this._saveToStorage();
        this._notifyListeners();
    }

    /**
     * Добавить слушатель изменений
     * @param {Function} listener - Функция слушатель
     */
    subscribe(listener) {
        if (!this._listeners) {
            this._listeners = [];
        }
        this._listeners.push(listener);
    }

    /**
     * Удалить слушатель изменений
     * @param {Function} listener - Функция слушатель
     */
    unsubscribe(listener) {
        if (this._listeners) {
            this._listeners = this._listeners.filter(l => l !== listener);
        }
    }

    /**
     * Уведомить слушателей об изменениях
     */
    _notifyListeners() {
        if (this._listeners) {
            this._listeners.forEach(listener => listener(this._state));
        }
    }

    /**
     * Перейти к следующему шагу
     */
    nextStep() {
        if (this._state.currentStep < this._state.totalSteps) {
            this._state.currentStep++;
            this._notifyListeners();
        }
    }

    /**
     * Перейти к предыдущему шагу
     */
    prevStep() {
        if (this._state.currentStep > 1) {
            this._state.currentStep--;
            this._notifyListeners();
        }
    }

    /**
     * Перейти к конкретному шагу
     * @param {number} step - Номер шага
     */
    goToStep(step) {
        if (step >= 1 && step <= this._state.totalSteps) {
            this._state.currentStep = step;
            this._notifyListeners();
        }
    }

    /**
     * Выбрать категорию
     * @param {string} categoryId - ID категории
     */
    selectCategory(categoryId) {
        this._state.selectedCategory = categoryId;
        this._notifyListeners();
    }

    /**
     * Добавить навык
     * @param {string} skill - Название навыка
     */
    addSkill(skill) {
        if (!this._state.selectedSkills.includes(skill)) {
            this._state.selectedSkills.push(skill);
            this._notifyListeners();
        }
    }

    /**
     * Удалить навык
     * @param {string} skill - Название навыка
     */
    removeSkill(skill) {
        this._state.selectedSkills = this._state.selectedSkills.filter(s => s !== skill);
        this._notifyListeners();
    }

    /**
     * Выбрать опыт работы
     * @param {string} experience - Опыт работы
     */
    selectExperience(experience) {
        this.updateFormData({ experienceYears: experience });
    }

    /**
     * Установить загруженный файл
     * @param {File} file - Загруженный файл
     */
    setUploadedFile(file) {
        this._state.uploadedFile = file;
        this._notifyListeners();
    }

    /**
     * Удалить загруженный файл
     */
    removeUploadedFile() {
        this._state.uploadedFile = null;
        this._notifyListeners();
    }

    /**
     * Установить состояние загрузки
     * @param {boolean} isLoading - Состояние загрузки
     */
    setLoading(isLoading) {
        this._state.isLoading = isLoading;
        this._notifyListeners();
    }

    /**
     * Установить ошибки валидации
     * @param {Object} errors - Объект ошибок
     */
    setErrors(errors) {
        this._state.errors = errors;
        this._notifyListeners();
    }

    /**
     * Очистить ошибки
     */
    clearErrors() {
        this._state.errors = {};
        this._notifyListeners();
    }

    /**
     * Получить данные формы для отправки
     */
    getFormDataForSubmit() {
        const formData = {
            ...this._state.formData,
            category: this._state.selectedCategory,
            skills: this._state.selectedSkills,
            hasResumeFile: !!this._state.uploadedFile
        };

        // Добавляем реальный Telegram ID если доступен через WebApp API
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            if (tgUser && tgUser.id) {
                formData.telegramUserId = tgUser.id;
                console.log('✅ Telegram User ID получен:', tgUser.id);
            }
        }

        return formData;
    }

    /**
     * Сбросить состояние формы
     */
    reset() {
        this._state = {
            currentStep: 1,
            totalSteps: 4,
            selectedCategory: null,
            selectedSkills: [],
            formData: {
                firstName: '',
                lastName: '',
                email: '',
                telegram: '',
                experienceYears: '',
                workFormat: '',
                geoPreference: '',
                salaryExpectation: '',
                profileLink: ''
            },
            uploadedFile: null,
            errors: {},
            isLoading: false
        };
        // Очищаем localStorage
        localStorage.removeItem('formProgress');
        this._notifyListeners();
    }

    /**
     * Валидация данных формы
     * @returns {boolean} Результат валидации
     */
    validateForm() {
        const errors = {};
        const formData = this._state.formData;

        // Проверка обязательных полей
        Object.entries(validationRules).forEach(([field, rules]) => {
            const value = formData[field];

            if (rules.required && (!value || value.trim() === '')) {
                errors[field] = `${field} обязательно для заполнения`;
            }

            if (value && rules.minLength && value.length < rules.minLength) {
                errors[field] = `Минимальная длина ${rules.minLength} символа`;
            }

            if (value && rules.pattern && !rules.pattern.test(value)) {
                errors[field] = 'Неверный формат';
            }
        });

        // Проверка категории
        if (!this._state.selectedCategory) {
            errors.category = 'Выберите специализацию';
        }

        // Проверка навыков
        if (this._state.selectedSkills.length === 0) {
            errors.skills = 'Выберите хотя бы один навык';
        }

        this._state.errors = errors;
        this._notifyListeners();

        return Object.keys(errors).length === 0;
    }
}

// Создаем глобальный экземпляр состояния
export const appState = new AppState();

/**
 * Хук для использования состояния в компонентах
 * @param {Function} callback - Функция обратного вызова при изменении состояния
 * @returns {Object} Текущее состояние
 */
export function useState(callback) {
    const state = appState.getState();
    appState.subscribe(callback);
    return state;
}

/**
 * Хук для получения данных формы
 * @returns {Object} Данные формы
 */
export function useFormData() {
    return appState.getState().formData;
}

/**
 * Хук для получения ошибок валидации
 * @returns {Object} Ошибки валидации
 */
export function useErrors() {
    return appState.getState().errors;
}
