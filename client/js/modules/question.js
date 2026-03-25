// ============================================
// modules/question.js — ЛОГИКА ВОПРОСА ПОЛЬЗОВАТЕЛЯ
// ============================================

/**
 * Состояние модуля вопроса
 */
let currentQuestion = '';           // Текущий вопрос
let hasSpread = false;              // Был ли уже сделан расклад
let isQuestionModuleInitialized = false; // Флаг инициализации

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Обновляет состояние кнопки «Получить расклад»
 * Активна только если есть текст вопроса
 */
function updateGetButtonState() {
    const btn = window.questionElements?.getBtn;
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

function initQuestionModule() {
    // Если уже инициализирован — выходим
    if (isQuestionModuleInitialized) {
        console.log('📝 Модуль вопроса уже инициализирован');
        return true;
    }
    
    console.log('📝 Инициализация модуля вопроса');
    
    const questionInput = document.getElementById('question-input');
    const getSpreadBtn = document.getElementById('get-spread-btn');
    const newQuestionBtn = document.getElementById('new-question-btn');
    const questionDisplay = document.getElementById('question-display');
    const displayedQuestionSpan = document.getElementById('displayed-question');
    const spreadContainer = document.getElementById('spread-container');
    const questionContainer = document.getElementById('question-container');
    const spreadControls = document.getElementById('spread-controls');
    
    // Если элементы не найдены — страница расклада ещё не активна, выходим
    if (!questionInput || !getSpreadBtn) {
        console.log('📝 Модуль вопроса: элементы не найдены (страница расклада не активна)');
        return false;
    }
    
    console.log('📝 Модуль вопроса: элементы найдены, инициализация');
    
    // Сохраняем ссылки на элементы для других функций
    window.questionElements = {
        input: questionInput,
        getBtn: getSpreadBtn,
        newQuestionBtn: newQuestionBtn,
        questionDisplay: questionDisplay,
        displayedQuestionSpan: displayedQuestionSpan,
        spreadContainer: spreadContainer,
        questionContainer: questionContainer,
        spreadControls: spreadControls
    };
    
    // Загружаем сохранённый вопрос из localStorage
    loadSavedQuestion();
    
    // Навешиваем обработчики (только если они ещё не навешены)
    if (!window._questionHandlersAttached) {
        questionInput.addEventListener('input', onQuestionInput);
        getSpreadBtn.addEventListener('click', onGetSpread);
        
        if (newQuestionBtn) {
            newQuestionBtn.addEventListener('click', onNewQuestion);
        }
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
    
    // Показываем вопрос в блоке отображения
    if (window.questionElements) {
        window.questionElements.displayedQuestionSpan.textContent = currentQuestion;
        window.questionElements.questionDisplay.style.display = 'block';
        window.questionElements.questionContainer.style.display = 'none';
        window.questionElements.spreadContainer.style.display = 'block';
        window.questionElements.spreadControls.style.display = 'flex';
    }
    
    hasSpread = true;
    
    // Генерируем расклад
    if (typeof loadSpread === 'function') {
        loadSpread();
        
        // Сохраняем расклад в localStorage после генерации
        setTimeout(() => {
            saveSpreadToLocalStorage();
        }, 100);
    }
}

/**
 * Обработчик нажатия на кнопку «Новый вопрос»
 */
function onNewQuestion() {
    console.log('✏️ Новый вопрос — возврат к форме');
    
    // Сбрасываем флаг инициализации
    isQuestionModuleInitialized = false;
    
    if (window.questionElements) {
        // Очищаем поле ввода
        window.questionElements.input.value = '';
        currentQuestion = '';
        updateGetButtonState();
        
        // Скрываем блок вопроса и расклад
        window.questionElements.questionDisplay.style.display = 'none';
        window.questionElements.spreadContainer.style.display = 'none';
        window.questionElements.spreadControls.style.display = 'none';
        
        // Показываем форму ввода
        window.questionElements.questionContainer.style.display = 'block';
        
        // Очищаем сохранённый расклад
        localStorage.removeItem('tarot_last_spread');
        localStorage.removeItem('tarot_last_question');
    }
    
    hasSpread = false;
}

// ============================================
// РАБОТА С LOCALSTORAGE
// ============================================

/**
 * Загружает сохранённый вопрос из localStorage
 */
function loadSavedQuestion() {
    const saved = localStorage.getItem('tarot_last_question');
    const savedSpread = localStorage.getItem('tarot_last_spread');
    
    if (saved && window.questionElements) {
        window.questionElements.input.value = saved;
        currentQuestion = saved;
        updateGetButtonState();
        
        // Если есть сохранённый расклад — показываем его
        if (savedSpread) {
            try {
                const spreadData = JSON.parse(savedSpread);
                if (spreadData.question === saved) {
                    // Восстанавливаем вопрос в блоке отображения
                    window.questionElements.displayedQuestionSpan.textContent = spreadData.question;
                    window.questionElements.questionDisplay.style.display = 'block';
                    window.questionElements.questionContainer.style.display = 'none';
                    window.questionElements.spreadContainer.style.display = 'block';
                    window.questionElements.spreadControls.style.display = 'flex';
                    
                    // Восстанавливаем карты
                    const partOneCards = document.getElementById('partOneCards');
                    const partTwoCards = document.getElementById('partTwoCards');
                    if (partOneCards && partTwoCards && spreadData.partOneHTML && spreadData.partTwoHTML) {
                        partOneCards.innerHTML = spreadData.partOneHTML;
                        partTwoCards.innerHTML = spreadData.partTwoHTML;
                    }
                    
                    hasSpread = true;
                    console.log('💾 Восстановлен сохранённый расклад');
                }
            } catch (e) {
                console.warn('Ошибка восстановления расклада:', e);
            }
        }
    }
}

/**
 * Сохраняет текущий расклад в localStorage
 */
function saveSpreadToLocalStorage() {
    const partOneCards = document.getElementById('partOneCards');
    const partTwoCards = document.getElementById('partTwoCards');
    
    if (!partOneCards || !partTwoCards) return;
    
    const spreadData = {
        question: currentQuestion,
        timestamp: Date.now(),
        partOneHTML: partOneCards.innerHTML,
        partTwoHTML: partTwoCards.innerHTML
    };
    
    localStorage.setItem('tarot_last_spread', JSON.stringify(spreadData));
    console.log('💾 Расклад сохранён в localStorage');
}