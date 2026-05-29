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
    let resultNewQuestionButtonElement = null;

    let areNavigationDomElementsBound = false;
    let areResultPageEventHandlersBound = false;

    // ============================================
    // DOM BINDING
    // ============================================

    function bindNavigationDomElements() {
        navigationButtonsContainerElement = document.getElementById('nav-buttons');
        resultNewQuestionButtonElement = document.getElementById('new-question-from-result-btn');

        areNavigationDomElementsBound = Boolean(navigationButtonsContainerElement);
        return areNavigationDomElementsBound;
    }

    function ensureNavigationDomElementsBound() {
        if (areNavigationDomElementsBound && navigationButtonsContainerElement) {
            return true;
        }

        return bindNavigationDomElements();
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

        if (typeof window.resetDeckModule === 'function') {
            window.resetDeckModule();
        }

        if (typeof window.resetQuestionModuleState === 'function') {
            window.resetQuestionModuleState({ clearStorage: true });
        }

        showPageById('page-question');
    }

    function bindResultPageEventHandlers() {
        if (areResultPageEventHandlersBound) {
            return true;
        }

        if (!resultNewQuestionButtonElement) {
            console.warn('Кнопка "Новый вопрос" на странице результата не найдена');
            return false;
        }

        resultNewQuestionButtonElement.addEventListener(
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
            if (typeof window.initQuestionModule === 'function') {
                window.initQuestionModule();
            }
        });

        return false;
    }

    function initializeSelectPageView() {
        requestAnimationFrame(() => {
            if (typeof window.displayQuestionOnSelectPage === 'function') {
                window.displayQuestionOnSelectPage();
            }

            if (typeof window.initDeckModule === 'function') {
                window.initDeckModule();
            }
        });
    }

    function initializeResultPageView() {
        requestAnimationFrame(() => {
            if (typeof window.restoreResultSpread === 'function') {
                window.restoreResultSpread();
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

        if (typeof window.resetDeckModule === 'function') {
            window.resetDeckModule();
        }

        showPageById('page-question');
    }

    // ============================================
    // PUBLIC API
    // ============================================

    // Сохраняем старые публичные имена для совместимости с main.js и другими модулями.
    window.createNavButtons = renderNavigationButtons;
    window.switchToPage = showPageById;
    window.goToSelectPage = navigateToSelectPage;
    window.goToResultPage = navigateToResultPage;
    window.goBackToQuestion = navigateBackToQuestionPage;
})();