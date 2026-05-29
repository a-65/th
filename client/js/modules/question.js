// ============================================
// modules/question.js — ЛОГИКА ВВОДА ВОПРОСА
// ============================================

/**
 * Состояние модуля вопроса
 */
let currentQuestion = '';           // Текущий вопрос
let isQuestionModuleInitialized = false; // Флаг инициализации

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Обновляет состояние кнопки «Получить расклад»
 * Активна только если есть текст вопроса
 */
function updateGetButtonState() {
    const btn = document.getElementById('get-spread-btn');
    if (btn) {
        btn.disabled = !currentQuestion || currentQuestion.trim() === '';
    }
}

/**
 * Сохраняет текущий вопрос в localStorage
 * @param {string} question - текст вопроса
 */
function saveQuestion(question) {
    if (question && question.trim()) {
        localStorage.setItem('tarot_last_question', question.trim());
    } else {
        localStorage.removeItem('tarot_last_question');
    }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

/**
 * Инициализирует модуль ввода вопроса на странице page-question
 */
function initQuestionModule() {
    if (isQuestionModuleInitialized) {
        console.log('📝 Модуль вопроса уже инициализирован');
        return true;
    }
    
    console.log('📝 Инициализация модуля вопроса');
    
    const questionInput = document.getElementById('question-input');
    const getSpreadBtn = document.getElementById('get-spread-btn');
    
    if (!questionInput || !getSpreadBtn) {
        console.log('📝 Модуль вопроса: элементы не найдены');
        return false;
    }
    
    console.log('📝 Модуль вопроса: элементы найдены, инициализация');
    
    // Загружаем сохранённый вопрос
    loadSavedQuestion();
    
    // Навешиваем обработчики
    if (!window._questionHandlersAttached) {
        questionInput.addEventListener('input', onQuestionInput);
        getSpreadBtn.addEventListener('click', onGetSpread);
        
        // Обработчик нажатия клавиши Enter
        questionInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (!getSpreadBtn.disabled && currentQuestion && currentQuestion.trim() !== '') {
                    onGetSpread();
                }
            }
        });
        
        window._questionHandlersAttached = true;
    }
    
    isQuestionModuleInitialized = true;
    return true;
}

// ============================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================

/**
 * Обработчик ввода текста в поле вопроса
 * @param {Event} event - событие input
 */
function onQuestionInput(event) {
    currentQuestion = event.target.value;
    updateGetButtonState();
}

/**
 * Обработчик нажатия на кнопку «Получить расклад»
 */
function onGetSpread() {
    if (!currentQuestion || currentQuestion.trim() === '') {
        console.warn('Вопрос не введён');
        return;
    }
    
    console.log('📝 Получен вопрос:', currentQuestion);
    
    // Сохраняем вопрос
    saveQuestion(currentQuestion);
    
    // Переходим на страницу выбора карт
    if (typeof window.goToSelectPage === 'function') {
        window.goToSelectPage(currentQuestion);
    } else {
        console.error('Ошибка: функция goToSelectPage не найдена');
    }
}

// ============================================
// РАБОТА С LOCALSTORAGE
// ============================================

/**
 * Загружает сохранённый вопрос из localStorage
 */
function loadSavedQuestion() {
    const saved = localStorage.getItem('tarot_last_question');
    
    if (saved && saved.trim()) {
        const questionInput = document.getElementById('question-input');
        if (questionInput) {
            questionInput.value = saved;
            currentQuestion = saved;
            updateGetButtonState();
            console.log('💾 Восстановлен сохранённый вопрос:', saved);
        }
    }
}

// ============================================
// ОТОБРАЖЕНИЕ ВОПРОСА НА СТРАНИЦЕ ВЫБОРА КАРТ
// ============================================

/**
 * Отображает вопрос на странице выбора карт
 * Вызывается при переходе на page-select
 */
function displayQuestionOnSelectPage() {
    const savedQuestion = localStorage.getItem('tarot_last_question');
    const questionSpan = document.getElementById('select-displayed-question');
    const refineBtn = document.getElementById('refine-question-btn');
    
    if (savedQuestion && questionSpan) {
        questionSpan.textContent = savedQuestion;
        console.log('📝 Вопрос отображён на странице выбора карт:', savedQuestion);
    }
    
    // Навешиваем обработчик на кнопку "Уточнить вопрос"
    if (refineBtn && !window._refineHandlerAttached) {
        refineBtn.addEventListener('click', () => {
            console.log('✏️ Уточнить вопрос — возврат к форме');
            if (typeof window.goBackToQuestion === 'function') {
                window.goBackToQuestion();
            }
        });
        window._refineHandlerAttached = true;
    }
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ДРУГИХ МОДУЛЕЙ
// ============================================

// Экспортируем функцию инициализации для navigation.js
window.initQuestionModule = initQuestionModule;

// Экспортируем функцию отображения вопроса для navigation.js
window.displayQuestionOnSelectPage = displayQuestionOnSelectPage;