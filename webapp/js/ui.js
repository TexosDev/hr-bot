/**
 * UI компоненты и утилиты
 * @module ui
 */

import { appState } from './state.js';
import { UI_CONSTANTS } from './config.js';

/**
 * Показать сообщение об ошибке
 * @param {string} message - Текст ошибки
 */
export function showError(message) {
    // Удаляем предыдущую ошибку
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Создаем новую ошибку
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-text">${message}</span>
        </div>
    `;

    // Добавляем стили для ошибки
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
        z-index: 1000;
        max-width: 300px;
        font-size: 14px;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(errorDiv);

    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }
    }, 5000);
}

/**
 * Показать сообщение об успехе
 * @param {string} message - Текст успеха
 */
export function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✅</span>
            <span class="success-text">${message}</span>
        </div>
    `;

    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        z-index: 1000;
        max-width: 300px;
        font-size: 14px;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => successDiv.remove(), 300);
        }
    }, 3000);
}

/**
 * Инициализация кастомных dropdown'ов
 */
export function initCustomDropdowns() {
    // Закрываем dropdown'ы при клике вне их
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-dropdown')) {
            closeAllDropdowns();
        }
    });

    // Закрываем dropdown'ы при изменении размера окна
    window.addEventListener('resize', function() {
        closeAllDropdowns();
    });

    // Закрываем dropdown'ы при прокрутке
    window.addEventListener('scroll', function() {
        closeAllDropdowns();
    });
}

/**
 * Переключение dropdown'а
 * @param {string} dropdownId - ID dropdown'а
 */
export function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    const menu = dropdown.querySelector('.dropdown-menu');
    const trigger = dropdown.querySelector('.dropdown-trigger');

    const isOpen = menu.classList.contains('show');

    // Закрываем все остальные dropdown'ы
    closeAllDropdowns();

    // Переключаем текущий (если он не был открыт)
    if (!isOpen) {
        menu.classList.add('show');
        trigger.classList.add('active');
    }
}

/**
 * Закрытие всех dropdown'ов
 */
export function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });
    document.querySelectorAll('.dropdown-trigger').forEach(trigger => {
        trigger.classList.remove('active');
    });
}

/**
 * Выбор опции из dropdown'а
 * @param {string} fieldType - Тип поля
 * @param {string} value - Значение
 * @param {string} text - Отображаемый текст
 * @param {HTMLElement} clickedElement - Элемент на который кликнули
 */
export function selectOption(fieldType, value, text, clickedElement) {
    const textElement = document.getElementById(fieldType + 'Text');
    const selectElement = document.getElementById(fieldType);

    // Обновляем отображаемый текст
    if (textElement) {
        textElement.textContent = text || value;
    }

    // Обновляем скрытый select
    if (selectElement) {
        selectElement.value = value;
    }

    // Обновляем состояние
    appState.updateFormData({ [fieldType]: value });

    // Обновляем визуальное состояние
    const dropdown = document.getElementById(fieldType + 'Dropdown');
    if (dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        const trigger = dropdown.querySelector('.dropdown-trigger');

        // Убираем выделение с других элементов
        menu.querySelectorAll('.dropdown-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Выделяем выбранный элемент
        if (clickedElement) {
            clickedElement.classList.add('selected');
        }

        // Закрываем dropdown
        menu.classList.remove('show');
        trigger.classList.remove('active');
    }
}

/**
 * Выбор опыта работы (теги)
 * @param {string} value - Значение опыта
 */
export function selectExperience(value) {
    const tags = document.querySelectorAll('.experience-tag');

    tags.forEach(tag => {
        if (tag.getAttribute('data-value') === value) {
            tag.classList.add('selected');
        } else {
            tag.classList.remove('selected');
        }
    });

    // Обновляем состояние
    appState.selectExperience(value);
}

/**
 * Отображение категорий
 */
export async function renderCategories() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;

    grid.innerHTML = '<div style="text-align: center; padding: 20px;">Загрузка категорий...</div>';

    try {
        // Пытаемся загрузить из API
        const { loadCategoriesFromAPI, categories: fallbackCategories } = await import('./config.js');
        const apiCategories = await loadCategoriesFromAPI();

        // Используем данные из API или fallback
        const categoriesToShow = apiCategories || fallbackCategories;

        if (!categoriesToShow || categoriesToShow.length === 0) {
            grid.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff4444;">Ошибка загрузки категорий</div>';
            return;
        }

        grid.innerHTML = '';

        categoriesToShow.forEach(category => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.addEventListener('click', () => selectCategory(category.id));
            card.innerHTML = `
                <h3>${category.icon ? category.icon + ' ' : ''}${category.name}</h3>
                <p>${category.description || ''}</p>
            `;
            grid.appendChild(card);
        });

        console.log(`✅ Загружено ${categoriesToShow.length} категорий`);

    } catch (error) {
        console.error('❌ Ошибка отображения категорий:', error);
        grid.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff4444;">Ошибка загрузки категорий</div>';
    }
}

/**
 * Выбор категории
 * @param {string} categoryId - ID категории
 */
export function selectCategory(categoryId) {
    // Убираем выделение со всех категорий
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Выделяем выбранную категорию
    const selectedCard = document.querySelector(`.category-card[onclick*="selectCategory('${categoryId}')"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    // Обновляем состояние
    appState.selectCategory(categoryId);

    // Показываем секцию навыков
    showSkillsSection(categoryId);
}

/**
 * Показать секцию навыков для выбранной категории
 * @param {string} categoryId - ID категории
 */
export function showSkillsSection(categoryId) {
    const skillsSection = document.getElementById('skillsSection');
    if (skillsSection) {
        skillsSection.style.display = 'block';

        // Очищаем предыдущие навыки
        const skillsGrid = document.getElementById('skillsGrid');
        if (skillsGrid) {
            skillsGrid.innerHTML = '';

            // Загружаем навыки для категории
            import('./config.js').then(({ skillsByCategory }) => {
                const skills = skillsByCategory[categoryId] || [];

                skills.forEach(skill => {
                    const skillTag = document.createElement('div');
                    skillTag.className = 'skill-tag';
                    skillTag.textContent = skill;
                    skillTag.addEventListener('click', function() {
                        toggleSkill(skill, this);
                    });
                    skillsGrid.appendChild(skillTag);
                });
            });
        }
    }
}

/**
 * Переключение навыка
 * @param {string} skill - Название навыка
 * @param {HTMLElement} skillElement - Элемент навыка
 */
export function toggleSkill(skill, skillElement) {
    if (!skillElement) return;

    if (skillElement.classList.contains('selected')) {
        skillElement.classList.remove('selected');
        appState.removeSkill(skill);
    } else {
        skillElement.classList.add('selected');
        appState.addSkill(skill);
    }
}

/**
 * Обработка выбора файла
 * @param {HTMLInputElement} input - Input элемент файла
 */
export function handleFileSelect(input) {
    const file = input.files[0];
    if (!file) return;

    // Проверяем тип файла
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showError('Пожалуйста, загрузите файл в формате PDF, DOC или DOCX');
        return;
    }

    // Проверяем размер файла (максимум 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB в байтах
    if (file.size > maxSize) {
        showError('Размер файла не должен превышать 10MB');
        return;
    }

    // Обновляем UI
    const fileName = document.getElementById('fileName');
    const fileInfo = document.getElementById('fileInfo');
    const uploadButton = document.getElementById('fileUploadButton');

    if (fileName && fileInfo && uploadButton) {
        fileName.textContent = file.name;
        fileInfo.style.display = 'flex';
        uploadButton.textContent = '✅ Файл загружен';

        // Обновляем состояние
        appState.setUploadedFile(file);
    }
}

/**
 * Удалить загруженный файл
 */
export function removeFile() {
    const input = document.getElementById('resumeFile');
    const fileName = document.getElementById('fileName');
    const fileInfo = document.getElementById('fileInfo');
    const uploadButton = document.getElementById('fileUploadButton');

    if (input && fileName && fileInfo && uploadButton) {
        input.value = '';
        fileName.textContent = '';
        fileInfo.style.display = 'none';
        uploadButton.textContent = '📎 Прикрепить файл резюме';

        // Обновляем состояние
        appState.removeUploadedFile();
    }
}

/**
 * Обновить отображение текущего шага
 */
export function updateStepDisplay() {
    const state = appState.getState();

    // Обновляем индикаторы шагов
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        const stepNumber = index + 1;
        if (stepNumber === state.currentStep) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });

    // Показываем/скрываем шаги
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNumber = index + 1;
        if (stepNumber === state.currentStep) {
            step.style.display = 'block';
        } else {
            step.style.display = 'none';
        }
    });

    // Обновляем кнопки навигации
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.style.display = state.currentStep > 1 ? 'block' : 'none';
    }

    if (nextBtn) {
        nextBtn.textContent = state.currentStep === state.totalSteps ? 'Завершить' : 'Далее';
    }
}

/**
 * Показать состояние загрузки
 * @param {boolean} show - Показать/скрыть загрузку
 */
export function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }

    // Блокируем кнопки во время загрузки
    document.querySelectorAll('button').forEach(button => {
        button.disabled = show;
    });
}

/**
 * Добавить анимации для лучшего UX
 */
export function addAnimations() {
    // Добавляем CSS для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .step {
            animation: fadeIn 0.3s ease;
        }

        .loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0088cc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Инициализация UI компонентов
 */
export function initUI() {
    addAnimations();
    initCustomDropdowns();
    updateStepDisplay();
}
