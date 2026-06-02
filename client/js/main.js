(() => {
    // ============================================
    // main.js — ТОЧКА ВХОДА ПРИЛОЖЕНИЯ
    // ============================================

    const NAVIGATION_PANEL_ANIMATION_DURATION_MS = 300;

    let welcomeContentElement = null;
    let historyContentElement = null;
    let rulesContentElement = null;

    let navigationToggleElement = null;
    let navigationButtonsContainerElement = null;
    let navigationOverlayElement = null;

    let isNavigationPanelAnimating = false;
    let areNavigationPanelEventHandlersBound = false;

    // ============================================
    // DOM BINDING
    // ============================================

    function bindMainDomElements() {
        welcomeContentElement = document.getElementById('welcome-content');
        historyContentElement = document.getElementById('history-content');
        rulesContentElement = document.getElementById('rules-content');

        navigationToggleElement = document.getElementById('nav-toggle');
        navigationButtonsContainerElement = document.getElementById('nav-buttons');
        navigationOverlayElement = document.querySelector('.nav-overlay');
    }

    // ============================================
    // CONTENT RENDERING
    // ============================================

    function renderTextWithLineBreaks(text) {
        if (typeof text !== 'string') {
            return '';
        }

        return text.replace(/\n/g, '<br>');
    }

    function renderParagraphArrayAsHtml(paragraphs) {
        if (!Array.isArray(paragraphs)) {
            return '';
        }

        return paragraphs
            .map((paragraph) => `<p>${renderTextWithLineBreaks(paragraph)}</p>`)
            .join('');
    }

    function renderWelcomePageContent() {
        if (!welcomeContentElement || typeof INTRO_TEXT === 'undefined') {
            return;
        }

        welcomeContentElement.innerHTML = renderTextWithLineBreaks(INTRO_TEXT);
    }

    function renderHistoryPageContent() {
        if (!historyContentElement || typeof HISTORY_TEXT === 'undefined') {
            return;
        }

        historyContentElement.innerHTML = renderParagraphArrayAsHtml(HISTORY_TEXT);
    }

    function renderRulesPageContent() {
        if (!rulesContentElement || typeof HEQET_TEXT === 'undefined') {
            return;
        }

        rulesContentElement.innerHTML = renderParagraphArrayAsHtml(HEQET_TEXT);
    }

    function renderStaticPageContent() {
        renderWelcomePageContent();
        renderHistoryPageContent();
        renderRulesPageContent();
    }

    // ============================================
    // NAVIGATION PANEL HELPERS
    // ============================================

    function ensureNavigationOverlayElement() {
        if (navigationOverlayElement) {
            return navigationOverlayElement;
        }

        const existingOverlayElement = document.querySelector('.nav-overlay');
        if (existingOverlayElement) {
            navigationOverlayElement = existingOverlayElement;
            return navigationOverlayElement;
        }

        navigationOverlayElement = document.createElement('div');
        navigationOverlayElement.className = 'nav-overlay';
        document.body.insertBefore(navigationOverlayElement, document.body.firstChild);

        return navigationOverlayElement;
    }

    function setBodyScrollLocked(isLocked) {
        document.body.style.overflow = isLocked ? 'hidden' : '';
    }

    function openNavigationPanel() {
        if (isNavigationPanelAnimating || !navigationButtonsContainerElement) {
            return;
        }

        const overlayElement = ensureNavigationOverlayElement();
        if (!overlayElement) {
            return;
        }

        isNavigationPanelAnimating = true;

        navigationButtonsContainerElement.classList.add('open');
        overlayElement.classList.add('active');
        setBodyScrollLocked(true);

        setTimeout(() => {
            isNavigationPanelAnimating = false;
        }, NAVIGATION_PANEL_ANIMATION_DURATION_MS);
    }

    function closeNavigationPanel() {
        if (isNavigationPanelAnimating || !navigationButtonsContainerElement) {
            return;
        }

        const overlayElement = ensureNavigationOverlayElement();
        if (!overlayElement) {
            return;
        }

        isNavigationPanelAnimating = true;

        navigationButtonsContainerElement.classList.remove('open');
        overlayElement.classList.remove('active');
        setBodyScrollLocked(false);

        setTimeout(() => {
            isNavigationPanelAnimating = false;
        }, NAVIGATION_PANEL_ANIMATION_DURATION_MS);
    }

    function toggleNavigationPanel() {
        if (isNavigationPanelAnimating || !navigationButtonsContainerElement) {
            return;
        }

        const isPanelOpen = navigationButtonsContainerElement.classList.contains('open');

        if (isPanelOpen) {
            closeNavigationPanel();
            return;
        }

        openNavigationPanel();
    }

    function handleNavigationToggleClick() {
        toggleNavigationPanel();
    }

    function handleNavigationOverlayClick() {
        closeNavigationPanel();
    }

    function handleNavigationButtonsContainerClick(event) {
        const navigationButton = event.target.closest('.nav-btn');

        if (navigationButton) {
            closeNavigationPanel();
        }
    }

    function handleDocumentKeyDown(event) {
        const isEscapePressed = event.key === 'Escape';
        const isPanelOpen = Boolean(
            navigationButtonsContainerElement &&
            navigationButtonsContainerElement.classList.contains('open')
        );

        if (isEscapePressed && isPanelOpen) {
            closeNavigationPanel();
        }
    }

    function bindNavigationPanelEventHandlers() {
        if (areNavigationPanelEventHandlersBound) {
            return true;
        }

        if (!navigationToggleElement || !navigationButtonsContainerElement) {
            console.warn('⚠️ Элементы для панели навигации не найдены');
            return false;
        }

        const overlayElement = ensureNavigationOverlayElement();
        if (!overlayElement) {
            console.warn('⚠️ Не удалось создать overlay для панели навигации');
            return false;
        }

        navigationToggleElement.addEventListener('click', handleNavigationToggleClick);
        overlayElement.addEventListener('click', handleNavigationOverlayClick);
        navigationButtonsContainerElement.addEventListener(
            'click',
            handleNavigationButtonsContainerClick
        );
        document.addEventListener('keydown', handleDocumentKeyDown);

        areNavigationPanelEventHandlersBound = true;
        return true;
    }

    function initializeNavigationPanel() {
        if (!navigationToggleElement || !navigationButtonsContainerElement) {
            console.warn('⚠️ Элементы для панели навигации не найдены');
            return false;
        }

        ensureNavigationOverlayElement();

        const isBound = bindNavigationPanelEventHandlers();

        if (isBound) {
            console.log('✅ Панель навигации инициализирована');
        }

        return isBound;
    }

    // ============================================
    // APPLICATION STARTUP HELPERS
    // ============================================

    function renderNavigationUi() {
        if (typeof window.createNavButtons === 'function') {
            window.createNavButtons();
            return true;
        }

        console.warn('⚠️ Функция createNavButtons недоступна');
        return false;
    }

    function hasSavedSpreadInStorage() {
        return Boolean(localStorage.getItem('tarot_last_complete_spread'));
    }

    function showInitialApplicationPage() {
        if (typeof window.switchToPage !== 'function') {
            console.warn('⚠️ Функция switchToPage недоступна');
            return false;
        }

        if (hasSavedSpreadInStorage()) {
            console.log('🔄 Найден сохранённый расклад, переходим на страницу результата');
            window.switchToPage('page-result');
            return true;
        }

        console.log('🏠 Нет сохранённого расклада, показываем страницу приветствия');
        window.switchToPage('page-welcome');
        return true;
    }

    // ============================================
    // APPLICATION BOOTSTRAP
    // ============================================

    function initializeApplication() {
        console.log('🚀 TarotHub: инициализация приложения');

        bindMainDomElements();
        renderStaticPageContent();
        renderNavigationUi();
        initializeNavigationPanel();
        showInitialApplicationPage();

        console.log('✅ Приложение инициализировано');
    }

    document.addEventListener('DOMContentLoaded', initializeApplication);
})();