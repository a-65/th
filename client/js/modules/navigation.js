// ============================================
// modules/navigation.js — УПРАВЛЕНИЕ НАВИГАЦИЕЙ
// ============================================

const allPages = [
    {
        id: 'page-welcome',
        buttonText: '«Таро Гранд Эттейла»',
        buttonIcon: '✨',
        buttonId: 'nav-to-welcome'
    },
    {
        id: 'page-history',
        buttonText: 'История «Таро Гранд Эттейла»',
        buttonIcon: '📜',
        buttonId: 'nav-to-history'
    },
    {
        id: 'page-rules',
        buttonText: 'Правила расклада «Прыжок Хекет»',
        buttonIcon: '🐸',
        buttonId: 'nav-to-rules'
    },
    {
        id: 'page-question',
        buttonText: 'Получить расклад «Прыжок Хекет»',
        buttonIcon: '🔮',
        buttonId: 'nav-to-question'
    }
];

const pagesWithoutGetSpread = ['page-select', 'page-result'];

/**
 * Возвращает ID активной страницы.
 *
 * Мы берём значение из utils.js.
 * Если по какой-то причине утилита недоступна,
 * используем безопасное значение по умолчанию.
 *
 * @returns {string}
 */
function resolveActivePageId() {
    if (typeof window.getActivePageId === 'function') {
        return window.getActivePageId();
    }
    return 'page-welcome';
}

/**
 * Создаёт кнопки навигации и добавляет их в DOM.
 */
function createNavButtons() {
    const navContainer = document.getElementById('nav-buttons');

    if (!navContainer) {
        console.error('Ошибка: контейнер nav-buttons не найден');
        return;
    }

    navContainer.innerHTML = '';

    const activePageId = resolveActivePageId();
    const hideGetSpread = pagesWithoutGetSpread.includes(activePageId);

    allPages.forEach((page) => {
        if (page.id === activePageId) {
            return;
        }

        if (hideGetSpread && page.id === 'page-question') {
            return;
        }

        const button = document.createElement('button');
        button.className = 'nav-btn';
        button.id = page.buttonId;
        button.innerHTML = `${page.buttonIcon} ${page.buttonText}`;
        button.addEventListener('click', () => switchToPage(page.id));

        navContainer.appendChild(button);
    });
}

/**
 * Переход на страницу результата, если в localStorage уже есть сохранённый расклад.
 * @param {HTMLElement} targetPage
 * @returns {boolean}
 */
function redirectToSavedResultIfNeeded(targetPage) {
    const savedSpread = localStorage.getItem('tarot_last_complete_spread');

    if (!savedSpread) {
        return false;
    }

    const resultPage = document.getElementById('page-result');

    if (!resultPage) {
        console.warn('Страница результата не найдена');
        return false;
    }

    targetPage.classList.remove('active-page');
    resultPage.classList.add('active-page');

    if (typeof window.restoreResultSpread === 'function') {
        window.restoreResultSpread();
    }

    createNavButtons();
    return true;
}

/**
 * Обрабатывает кнопку «Новый вопрос» на странице результата.
 */
function handleNewQuestionFromResult() {
    localStorage.removeItem('tarot_last_complete_spread');
    localStorage.removeItem('tarot_last_question');

    if (typeof window.resetDeckModule === 'function') {
        window.resetDeckModule();
    }

    if (typeof window.resetQuestionModuleState === 'function') {
        window.resetQuestionModuleState({ clearStorage: true });
    }

    switchToPage('page-question');
}

/**
 * Подключает обработчик кнопки «Новый вопрос» один раз.
 */
function bindNewQuestionButton() {
    const newQuestionButton = document.getElementById('new-question-from-result-btn');

    if (!newQuestionButton || newQuestionButton.dataset.bound) {
        return;
    }

    newQuestionButton.addEventListener('click', handleNewQuestionFromResult);
    newQuestionButton.dataset.bound = 'true';
}

/**
 * Переключает на указанную страницу.
 * @param {string} pageId
 */
function switchToPage(pageId) {
    const pageElements = document.querySelectorAll('.page');
    pageElements.forEach((page) => page.classList.remove('active-page'));

    const targetPage = document.getElementById(pageId);
    if (!targetPage) {
        console.error(`Ошибка: страница с id "${pageId}" не найдена`);
        return;
    }

    targetPage.classList.add('active-page');

    if (pageId === 'page-question') {
        const redirectedToResult = redirectToSavedResultIfNeeded(targetPage);

        if (redirectedToResult) {
            return;
        }

        requestAnimationFrame(() => {
            if (typeof window.initQuestionModule === 'function') {
                window.initQuestionModule();
            }
        });
    }

    if (pageId === 'page-select') {
        requestAnimationFrame(() => {
            if (typeof window.displayQuestionOnSelectPage === 'function') {
                window.displayQuestionOnSelectPage();
            }

            if (typeof window.initDeckModule === 'function') {
                window.initDeckModule();
            }
        });
    }

    if (pageId === 'page-result') {
        requestAnimationFrame(() => {
            if (typeof window.restoreResultSpread === 'function') {
                window.restoreResultSpread();
            }

            bindNewQuestionButton();
        });
    }

    createNavButtons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Переход на страницу выбора карт.
 * @param {string} question
 */
function goToSelectPage(question) {
    if (question && question.trim()) {
        localStorage.setItem('tarot_last_question', question.trim());
    }

    switchToPage('page-select');
}

/**
 * Переход на страницу готового расклада.
 */
function goToResultPage() {
    switchToPage('page-result');
}

/**
 * Возврат к вводу вопроса для уточнения формулировки.
 * Вопрос сохраняем, а расклад сбрасываем.
 */
function goBackToQuestion() {
    localStorage.removeItem('tarot_last_complete_spread');

    if (typeof window.resetDeckModule === 'function') {
        window.resetDeckModule();
    }

    switchToPage('page-question');
}

window.goToSelectPage = goToSelectPage;
window.goToResultPage = goToResultPage;
window.goBackToQuestion = goBackToQuestion;
window.getActivePageId = getActivePageId;
