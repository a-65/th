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
 * Нормализует текстовый ввод:
 * возвращает строку без лишних пробелов по краям,
 * а для нестроковых значений — пустую строку.
 *
 * Важно:
 * внутренние пробелы и переводы строк мы сохраняем,
 * чтобы пользователь мог формулировать вопрос в несколько строк.
 *
 * @param {unknown} value
 * @returns {string}
 */
function normalizeQuestionInput(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim();
}

/**
 * Проверяет, является ли вопрос пустым.
 *
 * @param {unknown} question
 * @returns {boolean}
 */
function isQuestionEmpty(question) {
    return normalizeQuestionInput(question) === '';
}

/**
 * Проверяет, можно ли сейчас отправить вопрос.
 * Это отдельная функция, чтобы правило не дублировалось
 * в обработчиках клавиатуры и кнопки.
 *
 * @returns {boolean}
 */
function canSubmitQuestion() {
    return !isQuestionEmpty(currentQuestion);
}

/**
 * Проверяет, нажал ли пользователь Enter без модификаторов.
 *
 * Логика такая:
 * - Enter — отправить вопрос
 * - Shift + Enter — новая строка
 * - Enter с Ctrl / Alt / Meta мы специально не обрабатываем
 *
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
function isQuestionSubmitShortcut(event) {
    return (
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
    );
}

/**
 * Сохраняет вопрос в localStorage.
 * Пустое значение удаляет ключ из хранилища.
 *
 * @param {string} question
 */
function saveQuestion(question) {
    const normalizedQuestion = normalizeQuestionInput(question);

    if (isQuestionEmpty(normalizedQuestion)) {
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

    getSpreadButton.disabled = !canSubmitQuestion();
}

/**
 * Синхронизирует поле ввода и переменную состояния с localStorage.
 */
function syncQuestionStateFromStorage() {
    const questionInput = getQuestionInput();

    if (!questionInput) {
        return;
    }

    currentQuestion = normalizeQuestionInput(getSavedQuestion());
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
 * Важно:
 * здесь мы сохраняем "сырой" ввод пользователя как есть.
 * Нормализацию делаем только в момент проверки и сохранения,
 * чтобы не ломать естественный процесс набора текста.
 *
 * @param {Event} event
 */
function onQuestionInput(event) {
    currentQuestion = event.target.value;
    updateGetButtonState();
}

/**
 * Обработчик нажатия клавиш в поле вопроса.
 *
 * Поведение:
 * - Enter отправляет вопрос
 * - Shift + Enter создаёт новую строку
 *
 * Мы используем keydown, а не keypress, потому что это
 * более предсказуемо для textarea и современных браузеров.
 *
 * @param {KeyboardEvent} event
 */
function onQuestionKeyDown(event) {
    if (!isQuestionSubmitShortcut(event)) {
        return;
    }

    event.preventDefault();

    if (!canSubmitQuestion()) {
        return;
    }

    onGetSpread();
}

/**
 * Обработчик нажатия на кнопку «Получить расклад».
 */
function onGetSpread() {
    const normalizedQuestion = normalizeQuestionInput(currentQuestion);

    if (isQuestionEmpty(normalizedQuestion)) {
        console.warn('Вопрос не введён');
        updateGetButtonState();
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
    questionInput.addEventListener('keydown', onQuestionKeyDown);
    getSpreadButton.addEventListener('click', onGetSpread);

    areQuestionHandlersBound = true;
    return true;
}

/**
 * Инициализирует модуль ввода вопроса на странице page-question.
 *
 * Важно: инициализация делает две разные задачи:
 * 1) один раз навешивает обработчики;
 * 2) каждый раз синхронизирует UI с актуальным состоянием.
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
    const savedQuestion = normalizeQuestionInput(getSavedQuestion());
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

window.initQuestionModule = initQuestionModule;
window.resetQuestionModuleState = resetQuestionModuleState;
window.displayQuestionOnSelectPage = displayQuestionOnSelectPage;