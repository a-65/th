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
        questionContainer: questionContainer,
        spreadControls: spreadControls
    };
    
    // Загружаем сохранённый вопрос из localStorage
    loadSavedQuestion();
    
    // Навешиваем обработчики
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
    
    // Обновляем текст вопроса в блоке отображения
    if (window.questionElements?.displayedQuestionSpan) {
        window.questionElements.displayedQuestionSpan.textContent = currentQuestion;
    }
    
    // Показываем блок отображения вопроса (убираем класс hidden)
    if (window.questionElements?.questionDisplay) {
        window.questionElements.questionDisplay.classList.remove('hidden');
    }
    
    // Скрываем контейнер ввода вопроса
    if (window.questionElements?.questionContainer) {
        window.questionElements.questionContainer.style.display = 'none';
    }
    
    hasSpread = true;
    
    // Показываем область расклада (убираем класс hidden)
    const spreadArea = document.getElementById('spread-area');
    if (spreadArea) {
        spreadArea.classList.remove('hidden');
    }
    
    // Инициализируем модуль колод (запускаем выбор карт)
    if (typeof window.initDeckModule === 'function') {
        console.log('🃟 Запускаем инициализацию колод...');
        window.initDeckModule();
    } else {
        console.error('Ошибка: модуль deck.js не загружен или initDeckModule не определён');
    }
    
    console.log('✅ Вопрос сохранён, запущен выбор карт');
}

/**
 * Обработчик нажатия на кнопку «Новый вопрос»
 */
function onNewQuestion() {
    console.log('✏️ Новый вопрос — возврат к форме');
    
    // Подтверждение сброса
    const confirmReset = confirm('Вы уверены, что хотите начать новый вопрос? Весь текущий прогресс будет потерян.');
    if (!confirmReset) {
        return;
    }
    
    // Сбрасываем флаг инициализации
    isQuestionModuleInitialized = false;
    window._questionHandlersAttached = false;
    
    // Очищаем поле ввода и сбрасываем состояние
    if (window.questionElements?.input) {
        window.questionElements.input.value = '';
        currentQuestion = '';
        updateGetButtonState();
    }
    
    // Скрываем блок отображения вопроса
    if (window.questionElements?.questionDisplay) {
        window.questionElements.questionDisplay.classList.add('hidden');
        console.log('✅ questionDisplay скрыт');
    }
    
    // Показываем контейнер ввода вопроса (напрямую через getElementById)
    const questionContainer = document.getElementById('question-container');
    if (questionContainer) {
        questionContainer.style.display = 'block';
        console.log('✅ questionContainer показан');
    } else {
        console.warn('❌ questionContainer не найден');
    }
    
    // Скрываем кнопки управления
    if (window.questionElements?.spreadControls) {
        window.questionElements.spreadControls.classList.add('hidden');
        console.log('✅ spreadControls скрыты');
    }
    
    hasSpread = false;
    
    // Очищаем сохранённые расклады
    localStorage.removeItem('tarot_last_complete_spread');
    localStorage.removeItem('tarot_last_question');
    console.log('✅ localStorage очищен');

    // Скрываем кнопки управления через класс hidden (не через style.display)
    if (window.questionElements?.spreadControls) {
        window.questionElements.spreadControls.classList.add('hidden');
        console.log('✅ spreadControls скрыты (через класс hidden)');
    }
    
    // Скрываем область расклада
    const spreadArea = document.getElementById('spread-area');
    if (spreadArea) {
        spreadArea.classList.add('hidden');
        console.log('✅ spreadArea скрыта');
    }
    
    // Очищаем интерфейс колоды и позиций
    const deckContainer = document.getElementById('deck-container');
    const part1Container = document.getElementById('part1-positions');
    const part2Container = document.getElementById('part2-positions');
    const spreadControls = document.getElementById('spread-controls');
    const part1Grid = document.getElementById('part1-grid');
    const part2Grid = document.getElementById('part2-grid');
    
    // Очищаем сетки позиций
    if (part1Grid && window.createEmptySlot && window.getPart1PositionTitle) {
        part1Grid.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const emptySlot = window.createEmptySlot(window.getPart1PositionTitle(i));
            part1Grid.appendChild(emptySlot);
        }
        console.log('✅ part1Grid очищен');
    }
    
    if (part2Grid && window.createEmptySlot && window.getPart2PositionTitle) {
        part2Grid.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const emptySlot = window.createEmptySlot(window.getPart2PositionTitle(i));
            part2Grid.appendChild(emptySlot);
        }
        console.log('✅ part2Grid очищен');
    }
    
    // Сбрасываем отображение контейнеров
    if (deckContainer) deckContainer.style.display = 'flex';
    if (part1Container) part1Container.style.display = 'block';
    if (part2Container) part2Container.style.display = 'none';
    
    // Очищаем контейнер колоды
    if (deckContainer) {
        deckContainer.innerHTML = '';
        console.log('✅ deckContainer очищен');
    }
    
    // Сбрасываем выбранные карты
    selectedCardsPart1 = [];
    selectedCardsPart2 = [];
    currentDeckCards = [];
    
    console.log('✅ Возврат к форме ввода вопроса');
}

// ============================================
// РАБОТА С LOCALSTORAGE
// ============================================

/**
 * Загружает сохранённый вопрос из localStorage
 */
function loadSavedQuestion() {
    const saved = localStorage.getItem('tarot_last_question');
    const savedSpread = localStorage.getItem('tarot_last_complete_spread');
    
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
                    window.questionElements.questionDisplay.classList.remove('hidden');
                    window.questionElements.questionContainer.style.display = 'none';
                    
                    // Показываем кнопки управления (убираем класс hidden)
                    if (window.questionElements.spreadControls) {
                        window.questionElements.spreadControls.classList.remove('hidden');
                        console.log('✅ Кнопки управления показаны (при восстановлении)');
                    }
                    
                    // Восстанавливаем карты (будет в deck.js)
                    console.log('💾 Восстановлен сохранённый расклад (карты будут восстановлены в deck.js)');
                    
                    hasSpread = true;
                }
            } catch (e) {
                console.warn('Ошибка восстановления расклада:', e);
            }
        }
    }
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ДРУГИХ МОДУЛЕЙ
// ============================================

// Экспортируем функцию инициализации для navigation.js
window.initQuestionModule = initQuestionModule;