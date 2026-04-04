// ============================================
// modules/question.js — ЛОГИКА ВВОДА ВОПРОСА
// ============================================

const QUESTION_STORAGE_KEY = 'tarot_last_question';

let currentQuestion = '';
let areQuestionHandlersBound = false;

/**
 * Возвращает поле ввода вопроса.
 * @returns {HTMLTextAreaElement | null}
 */
function getQuestionInput() {
    return document.getElementById('question-input');
}

/**
 * Возвращает кнопку «Получить расклад».
 * @returns {HTMLButtonElement | null}
 */
function getGetSpreadButton() {
    return document.getElementById('get-spread-btn');
}

/**
 * Возвращает сохранённый вопрос из localStorage.
 * @returns {string}
 */
function getSavedQuestion() {
    return localStorage.getItem(QUESTION_STORAGE_KEY) || '';
}

/**
 * Сохраняет вопрос в localStorage.
 * Пустое значение удаляет ключ из хранилища.
 *
 * @param {string} question
 */
function saveQuestion(question) {
    const normalizedQuestion = question.trim();

    if (normalizedQuestion === '') {
        localStorage.removeItem(QUESTION_STORAGE_KEY);
        return;
    }

    localStorage.setItem(QUESTION_STORAGE_KEY, normalizedQuestion);
}

/**
 * Обновляет состояние кнопки «Получить расклад».
 */
function updateGetButtonState() {
    const getSpreadButton = getGetSpreadButton();

    if (!getSpreadButton) {
        return;
    }

    getSpreadButton.disabled = isQuestionEmpty(currentQuestion);
}

/**
 * Синхронизирует поле ввода и переменную состояния с localStorage.
 */
function syncQuestionStateFromStorage() {
    const questionInput = getQuestionInput();

    if (!questionInput) {
        return;
    }

    currentQuestion = getSavedQuestion();
    questionInput.value = currentQuestion;

    updateGetButtonState();
}

/**
 * Полностью сбрасывает состояние модуля вопроса.
 * Используется, когда пользователь начинает новый расклад.
 *
 * @param {{ clearStorage?: boolean }} options
 */
function resetQuestionModuleState(options = {}) {
    const { clearStorage = false } = options;
    const questionInput = getQuestionInput();

    currentQuestion = '';

    if (questionInput) {
        questionInput.value = '';
    }

    if (clearStorage) {
        localStorage.removeItem(QUESTION_STORAGE_KEY);
    }

    updateGetButtonState();
}

/**
 * Обработчик ввода текста в поле вопроса.
 *
 * @param {Event} event
 */
function onQuestionInput(event) {
    currentQuestion = event.target.value;
    updateGetButtonState();
}

/**
 * Обработчик нажатия Enter в поле вопроса.
 * Пока сохраняем текущее поведение прототипа:
 * Enter отправляет вопрос, если кнопка активна.
 *
 * @param {KeyboardEvent} event
 */
function onQuestionKeyPress(event) {
    if (event.key !== 'Enter') {
        return;
    }

    const getSpreadButton = getGetSpreadButton();

    event.preventDefault();

    if (!getSpreadButton || getSpreadButton.disabled) {
        return;
    }

    if (isQuestionEmpty(currentQuestion)) {
        return;
    }

    onGetSpread();
}

/**
 * Обработчик нажатия на кнопку «Получить расклад».
 */
function onGetSpread() {
    const normalizedQuestion = currentQuestion.trim();

    if (normalizedQuestion === '') {
        console.warn('Вопрос не введён');
        return;
    }

    saveQuestion(normalizedQuestion);

    if (typeof window.goToSelectPage === 'function') {
        window.goToSelectPage(normalizedQuestion);
        return;
    }

    console.error('Ошибка: функция goToSelectPage не найдена');
}

/**
 * Навешивает обработчики событий.
 * Мы делаем это только один раз за всё время жизни страницы,
 * потому что DOM-элементы не пересоздаются при переключении экранов.
 */
function bindQuestionHandlers() {
    const questionInput = getQuestionInput();
    const getSpreadButton = getGetSpreadButton();

    if (!questionInput || !getSpreadButton) {
        console.warn('Модуль вопроса: элементы не найдены, обработчики не подключены');
        return false;
    }

    questionInput.addEventListener('input', onQuestionInput);
    questionInput.addEventListener('keypress', onQuestionKeyPress);
    getSpreadButton.addEventListener('click', onGetSpread);

    areQuestionHandlersBound = true;
    return true;
}

/**
 * Инициализирует модуль ввода вопроса на странице page-question.
 *
 * Важно: инициализация теперь делает две разные задачи:
 * 1) один раз навешивает обработчики;
 * 2) каждый раз синхронизирует UI с актуальным состоянием.
 * Это решает баг, когда после «Нового вопроса» поле могло остаться в старом состоянии.
 */
function initQuestionModule() {
    const questionInput = getQuestionInput();
    const getSpreadButton = getGetSpreadButton();

    if (!questionInput || !getSpreadButton) {
        console.warn('Модуль вопроса: элементы не найдены');
        return false;
    }

    if (!areQuestionHandlersBound) {
        bindQuestionHandlers();
    }

    syncQuestionStateFromStorage();
    return true;
}

/**
 * Отображает вопрос на странице выбора карт.
 * Вызывается при переходе на page-select.
 */
function displayQuestionOnSelectPage() {
    const savedQuestion = getSavedQuestion();
    const questionSpan = document.getElementById('select-displayed-question');
    const refineButton = document.getElementById('refine-question-btn');

    if (questionSpan) {
        questionSpan.textContent = savedQuestion;
    }

    if (refineButton && !refineButton.dataset.bound) {
        refineButton.addEventListener('click', () => {
            if (typeof window.goBackToQuestion === 'function') {
                window.goBackToQuestion();
            }
        });

        refineButton.dataset.bound = 'true';
    }
}

/**
 * Нормализует текстовый ввод:
 * возвращает строку без лишних пробелов по краям,
 * а для нестроковых значений — пустую строку.
 *
 * @param {unknown} value
 * @returns {string}
 */
function isQuestionEmpty(question) {
    if (typeof question !== 'string') {
        return true;
    }

    return question.trim() === '';
}
        



window.initQuestionModule = initQuestionModule;
window.resetQuestionModuleState = resetQuestionModuleState;
window.displayQuestionOnSelectPage = displayQuestionOnSelectPage;
