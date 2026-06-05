(() => {
    // ============================================
    // modules/navigation.js — УПРАВЛЕНИЕ НАВИГАЦИЕЙ
    // ============================================

    const NAVIGATION_PAGE_DEFINITIONS = [
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

    const PAGE_IDS_WITHOUT_QUESTION_ENTRY_BUTTON = ['page-select', 'page-result'];

    let navigationButtonsContainerElement = null;
    let resultPageNewQuestionButtonElement = null;

    let areNavigationDomElementsBound = false;
    let areResultPageDomElementsBound = false;
    let areResultPageEventHandlersBound = false;

    // ============================================
    // DOM BINDING
    // ============================================

    function bindNavigationDomElements() {
        navigationButtonsContainerElement = document.getElementById('nav-buttons');

        areNavigationDomElementsBound = Boolean(navigationButtonsContainerElement);
        return areNavigationDomElementsBound;
    }

    function ensureNavigationDomElementsBound() {
        if (areNavigationDomElementsBound && navigationButtonsContainerElement) {
            return true;
        }

        return bindNavigationDomElements();
    }

    function bindResultPageDomElements() {
        resultPageNewQuestionButtonElement = document.getElementById('new-question-from-result-btn');

        areResultPageDomElementsBound = Boolean(resultPageNewQuestionButtonElement);
        return areResultPageDomElementsBound;
    }

    function ensureResultPageDomElementsBound() {
        if (areResultPageDomElementsBound && resultPageNewQuestionButtonElement) {
            return true;
        }

        return bindResultPageDomElements();
    }

    // ============================================
    // PAGE HELPERS
    // ============================================

    function getCurrentActivePageId() {
        if (typeof window.getActivePageId === 'function') {
            return window.getActivePageId();
        }

        return 'page-welcome';
    }

    function getPageElementById(pageId) {
        return document.getElementById(pageId);
    }

    function getAllPageElements() {
        return Array.from(document.querySelectorAll('.page'));
    }

    function hideAllPages() {
        getAllPageElements().forEach((pageElement) => {
            pageElement.classList.remove('active-page');
        });
    }

    function activatePageElement(pageElement) {
        pageElement.classList.add('active-page');
    }

    function shouldHideQuestionEntryNavigationButton(activePageId) {
        return PAGE_IDS_WITHOUT_QUESTION_ENTRY_BUTTON.includes(activePageId);
    }

    // ============================================
    // NAVIGATION RENDERING
    // ============================================

    function renderNavigationButtons() {
        if (!ensureNavigationDomElementsBound()) {
            console.error('Ошибка: контейнер nav-buttons не найден');
            return false;
        }

        navigationButtonsContainerElement.innerHTML = '';

        const activePageId = getCurrentActivePageId();
        const shouldHideQuestionEntryButton =
            shouldHideQuestionEntryNavigationButton(activePageId);

        NAVIGATION_PAGE_DEFINITIONS.forEach((pageDefinition) => {
            if (pageDefinition.id === activePageId) {
                return;
            }

            if (shouldHideQuestionEntryButton && pageDefinition.id === 'page-question') {
                return;
            }

            const buttonElement = document.createElement('button');
            buttonElement.className = 'nav-btn';
            buttonElement.id = pageDefinition.buttonId;
            buttonElement.innerHTML = `${pageDefinition.buttonIcon} ${pageDefinition.buttonText}`;
            buttonElement.addEventListener('click', () => showPageById(pageDefinition.id));

            navigationButtonsContainerElement.appendChild(buttonElement);
        });

        return true;
    }

    // ============================================
    // PAGE-SPECIFIC ACTIONS
    // ============================================

    function tryRedirectQuestionPageToSavedResult(questionPageElement) {
        const savedSpread = localStorage.getItem('tarot_last_complete_spread');

        if (!savedSpread) {
            return false;
        }

        const resultPageElement = getPageElementById('page-result');

        if (!resultPageElement) {
            console.warn('Страница результата не найдена');
            return false;
        }

        questionPageElement.classList.remove('active-page');
        activatePageElement(resultPageElement);
        initializeResultPageView();

        return true;
    }

    function handleResultPageNewQuestionClick() {
        localStorage.removeItem('tarot_last_complete_spread');
        localStorage.removeItem('tarot_last_question');

        if (typeof window.resetDeckSelectionState === 'function') {
            window.resetDeckSelectionState();
        }

        if (typeof window.resetQuestionPageState === 'function') {
            window.resetQuestionPageState({ clearStorage: true });
        }

        showPageById('page-question');
    }

    function bindResultPageEventHandlers() {
        if (areResultPageEventHandlersBound) {
            return true;
        }

        if (!ensureResultPageDomElementsBound()) {
            console.warn('Кнопка "Новый вопрос" на странице результата не найдена');
            return false;
        }

        resultPageNewQuestionButtonElement.addEventListener(
            'click',
            handleResultPageNewQuestionClick
        );

        areResultPageEventHandlersBound = true;
        return true;
    }

    function initializeQuestionPageView(questionPageElement) {
        const wasRedirected = tryRedirectQuestionPageToSavedResult(questionPageElement);

        if (wasRedirected) {
            return true;
        }

        requestAnimationFrame(() => {
            if (typeof window.initializeQuestionPage === 'function') {
                window.initializeQuestionPage();
            }
        });

        return false;
    }

    function initializeSelectPageView() {
        requestAnimationFrame(() => {
            if (typeof window.renderQuestionOnSelectPage === 'function') {
                window.renderQuestionOnSelectPage();
            }

            if (typeof window.initializeDeckSelectionPage === 'function') {
                window.initializeDeckSelectionPage();
            }
        });
    }

function initializeResultPageView() {
    ensureResultPageDomElementsBound();

    requestAnimationFrame(() => {
        if (typeof window.restoreSpreadOnResultPage === 'function') {
            window.restoreSpreadOnResultPage();
        }

        bindResultPageEventHandlers();
    });
}

    function runPageInitialization(pageId, targetPageElement) {
        if (pageId === 'page-question') {
            return initializeQuestionPageView(targetPageElement);
        }

        if (pageId === 'page-select') {
            initializeSelectPageView();
            return false;
        }

        if (pageId === 'page-result') {
            initializeResultPageView();
            return false;
        }

        return false;
    }

    // ============================================
    // PAGE SWITCHING
    // ============================================

    function showPageById(pageId) {
        hideAllPages();

        const targetPageElement = getPageElementById(pageId);
        if (!targetPageElement) {
            console.error(`Ошибка: страница с id "${pageId}" не найдена`);
            return false;
        }

        activatePageElement(targetPageElement);
        runPageInitialization(pageId, targetPageElement);

        renderNavigationButtons();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        return true;
    }

    // ============================================
    // PUBLIC NAVIGATION ACTIONS
    // ============================================

    function navigateToSelectPage(questionText) {
        const normalizedQuestionText =
            typeof questionText === 'string' ? questionText.trim() : '';

        if (normalizedQuestionText) {
            localStorage.setItem('tarot_last_question', normalizedQuestionText);
        }

        showPageById('page-select');
    }

    function navigateToResultPage() {
        showPageById('page-result');
    }

    function navigateBackToQuestionPage() {
        localStorage.removeItem('tarot_last_complete_spread');

        if (typeof window.resetDeckSelectionState === 'function') {
            window.resetDeckSelectionState();
        }

        showPageById('page-question');
    }

    // ============================================
    // PUBLIC API
    // ============================================

    // Новый предпочтительный публичный API.
    window.renderNavigationButtons = renderNavigationButtons;
    window.showPageById = showPageById;
    window.navigateToSelectPage = navigateToSelectPage;
    window.navigateToResultPage = navigateToResultPage;
    window.navigateBackToQuestionPage = navigateBackToQuestionPage;

    // Временные алиасы для обратной совместимости.
    // Будут удалены после перевода всех вызовов на новые имена.
    window.createNavButtons = window.renderNavigationButtons;
    window.switchToPage = window.showPageById;
    window.goToSelectPage = window.navigateToSelectPage;
    window.goToResultPage = window.navigateToResultPage;
    window.goBackToQuestion = window.navigateBackToQuestionPage;
})();