(() => {
    // ============================================
    // modules/question.js — ЛОГИКА ВВОДА ВОПРОСА
    // ============================================

    const QUESTION_STORAGE_KEY = 'tarot_last_question';

    let currentQuestionText = '';
    let areQuestionPageHandlersBound = false;
    let isSelectPageHandlerBound = false;

    // --------------------------------------------
    // КЕШИРУЕМЫЕ DOM-ЭЛЕМЕНТЫ СТРАНИЦЫ ВОПРОСА
    // --------------------------------------------
    let questionTextareaElement = null;
    let submitSpreadButtonElement = null;

    // --------------------------------------------
    // КЕШИРУЕМЫЕ DOM-ЭЛЕМЕНТЫ СТРАНИЦЫ ВЫБОРА КАРТ
    // --------------------------------------------
    let selectedPageQuestionTextElement = null;
    let refineQuestionButtonElement = null;

    // ============================================
    // STORAGE HELPERS
    // ============================================

    /**
     * Возвращает сохранённый вопрос из localStorage.
     * @returns {string}
     */
    function readSavedQuestionFromStorage() {
        return localStorage.getItem(QUESTION_STORAGE_KEY) || '';
    }

    /**
     * Удаляет сохранённый вопрос из localStorage.
     */
    function clearSavedQuestionFromStorage() {
        localStorage.removeItem(QUESTION_STORAGE_KEY);
    }

    /**
     * Сохраняет вопрос в localStorage.
     * Пустое значение удаляет ключ из хранилища.
     *
     * @param {string} questionText
     */
    function saveQuestionToStorage(questionText) {
        const normalizedQuestionText = normalizeQuestionText(questionText);

        if (isQuestionTextEmpty(normalizedQuestionText)) {
            clearSavedQuestionFromStorage();
            return;
        }

        localStorage.setItem(QUESTION_STORAGE_KEY, normalizedQuestionText);
    }

    // ============================================
    // TEXT HELPERS
    // ============================================

    /**
     * Нормализует текст вопроса:
     * убирает пробелы по краям строки,
     * но сохраняет внутренние пробелы и переводы строк.
     *
     * @param {unknown} value
     * @returns {string}
     */
    function normalizeQuestionText(value) {
        if (typeof value !== 'string') {
            return '';
        }

        return value.trim();
    }

    /**
     * Проверяет, пустой ли вопрос.
     *
     * @param {unknown} questionText
     * @returns {boolean}
     */
    function isQuestionTextEmpty(questionText) {
        return normalizeQuestionText(questionText) === '';
    }

    /**
     * Проверяет, можно ли сейчас отправить вопрос.
     *
     * @returns {boolean}
     */
    function canSubmitCurrentQuestion() {
        return !isQuestionTextEmpty(currentQuestionText);
    }

    /**
     * Проверяет, нажал ли пользователь Enter без модификаторов.
     *
     * @param {KeyboardEvent} event
     * @returns {boolean}
     */
    function isSubmitShortcutPressed(event) {
        return (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey
        );
    }

    // ============================================
    // DOM BINDING
    // ============================================

    /**
     * Привязывает DOM-элементы страницы вопроса.
     *
     * @returns {boolean}
     */
    function bindQuestionPageDomElements() {
        questionTextareaElement = document.getElementById('question-input');
        submitSpreadButtonElement = document.getElementById('get-spread-btn');

        return Boolean(questionTextareaElement && submitSpreadButtonElement);
    }

    /**
     * Гарантирует, что DOM страницы вопроса доступен.
     *
     * @returns {boolean}
     */
    function ensureQuestionPageDomElementsBound() {
        if (questionTextareaElement && submitSpreadButtonElement) {
            return true;
        }

        return bindQuestionPageDomElements();
    }

    /**
     * Привязывает DOM-элементы страницы выбора карт.
     *
     * @returns {boolean}
     */
    function bindSelectPageDomElements() {
        selectedPageQuestionTextElement = document.getElementById('select-displayed-question');
        refineQuestionButtonElement = document.getElementById('refine-question-btn');

        return Boolean(selectedPageQuestionTextElement && refineQuestionButtonElement);
    }

    /**
     * Гарантирует, что DOM страницы выбора карт доступен.
     *
     * @returns {boolean}
     */
    function ensureSelectPageDomElementsBound() {
        if (selectedPageQuestionTextElement && refineQuestionButtonElement) {
            return true;
        }

        return bindSelectPageDomElements();
    }

    // ============================================
    // UI HELPERS
    // ============================================

    /**
     * Синхронизирует состояние кнопки отправки.
     */
    function syncSubmitButtonState() {
        if (!submitSpreadButtonElement) {
            return;
        }

        submitSpreadButtonElement.disabled = !canSubmitCurrentQuestion();
    }

    /**
     * Синхронизирует состояние question-page со storage.
     */
    function syncQuestionPageWithStorage() {
        if (!questionTextareaElement) {
            return;
        }

        currentQuestionText = normalizeQuestionText(readSavedQuestionFromStorage());
        questionTextareaElement.value = currentQuestionText;

        syncSubmitButtonState();
    }

    /**
     * Отрисовывает вопрос на странице выбора карт.
     */
    function renderSavedQuestionOnSelectPage() {
        if (!selectedPageQuestionTextElement) {
            return;
        }

        selectedPageQuestionTextElement.textContent = normalizeQuestionText(
            readSavedQuestionFromStorage()
        );
    }

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Полностью сбрасывает состояние модуля вопроса.
     *
     * @param {{ clearStorage?: boolean }} options
     */
    function resetQuestionState(options = {}) {
        const { clearStorage = false } = options;

        currentQuestionText = '';

        if (clearStorage) {
            clearSavedQuestionFromStorage();
        }

        if (questionTextareaElement) {
            questionTextareaElement.value = '';
        }

        syncSubmitButtonState();
    }

    /**
     * Отправляет вопрос и запускает переход к раскладу.
     */
    function submitQuestion() {
        const normalizedQuestionText = normalizeQuestionText(currentQuestionText);

        if (isQuestionTextEmpty(normalizedQuestionText)) {
            console.warn('Вопрос не введён');
            syncSubmitButtonState();
            return;
        }

        currentQuestionText = normalizedQuestionText;

        if (questionTextareaElement) {
            questionTextareaElement.value = currentQuestionText;
        }

        saveQuestionToStorage(currentQuestionText);

        if (typeof window.navigateToSelectPage === 'function') {
            window.navigateToSelectPage(currentQuestionText);
            return;
        }

        console.error('Ошибка: функция navigateToSelectPage не найдена');
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    /**
     * Обрабатывает ввод текста в textarea вопроса.
     *
     * @param {Event} event
     */
    function handleQuestionTextareaInput(event) {
        const nextQuestionText =
            event.target && typeof event.target.value === 'string'
                ? event.target.value
                : '';

        currentQuestionText = nextQuestionText;
        syncSubmitButtonState();
    }

    /**
     * Обрабатывает нажатия клавиш в textarea вопроса.
     *
     * @param {KeyboardEvent} event
     */
    function handleQuestionTextareaKeyDown(event) {
        if (!isSubmitShortcutPressed(event)) {
            return;
        }

        event.preventDefault();

        if (!canSubmitCurrentQuestion()) {
            return;
        }

        submitQuestion();
    }

    /**
     * Обрабатывает нажатие кнопки уточнения вопроса.
     */
    function handleRefineQuestionButtonClick() {
        if (typeof window.navigateBackToQuestionPage === 'function') {
            window.navigateBackToQuestionPage();
            return;
        }

        console.error('Ошибка: функция navigateBackToQuestionPage не найдена');
    }

    // ============================================
    // EVENT BINDING
    // ============================================

    /**
     * Навешивает обработчики страницы вопроса один раз.
     *
     * @returns {boolean}
     */
    function bindQuestionPageEventHandlers() {
        if (!questionTextareaElement || !submitSpreadButtonElement) {
            console.warn('Модуль вопроса: элементы страницы вопроса не найдены');
            return false;
        }

        questionTextareaElement.addEventListener('input', handleQuestionTextareaInput);
        questionTextareaElement.addEventListener('keydown', handleQuestionTextareaKeyDown);
        submitSpreadButtonElement.addEventListener('click', submitQuestion);

        areQuestionPageHandlersBound = true;
        return true;
    }

    /**
     * Навешивает обработчик страницы выбора карт один раз.
     *
     * @returns {boolean}
     */
    function bindSelectPageEventHandlers() {
        if (!refineQuestionButtonElement) {
            console.warn('Модуль вопроса: кнопка уточнения вопроса не найдена');
            return false;
        }

        refineQuestionButtonElement.addEventListener('click', handleRefineQuestionButtonClick);
        isSelectPageHandlerBound = true;
        return true;
    }

    // ============================================
    // MODULE API
    // ============================================

    /**
     * Инициализирует модуль question page.
     *
     * @returns {boolean}
     */
    function initializeQuestionModule() {
        if (!ensureQuestionPageDomElementsBound()) {
            console.warn('Модуль вопроса: элементы страницы вопроса не найдены');
            return false;
        }

        if (!areQuestionPageHandlersBound) {
            bindQuestionPageEventHandlers();
        }

        syncQuestionPageWithStorage();
        return true;
    }

    /**
     * Обновляет select page отображением сохранённого вопроса.
     *
     * @returns {boolean}
     */
    function renderQuestionOnSelectPage() {
        if (!ensureSelectPageDomElementsBound()) {
            console.warn('Модуль вопроса: элементы страницы выбора карт не найдены');
            return false;
        }

        if (!isSelectPageHandlerBound) {
            bindSelectPageEventHandlers();
        }

        renderSavedQuestionOnSelectPage();
        return true;
    }

    // ============================================
    // PUBLIC API
    // ============================================

    // Новый предпочтительный публичный API.
    window.initializeQuestionPage = initializeQuestionModule;
    window.resetQuestionPageState = resetQuestionState;
    window.renderQuestionOnSelectPage = renderQuestionOnSelectPage;

    // Временные алиасы для обратной совместимости.
    // Будут удалены после перевода всех вызовов на новые имена.
    window.initQuestionModule = window.initializeQuestionPage;
    window.resetQuestionModuleState = window.resetQuestionPageState;
    window.displayQuestionOnSelectPage = window.renderQuestionOnSelectPage;
})();