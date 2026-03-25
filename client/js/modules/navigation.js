// ============================================
// modules/navigation.js — УПРАВЛЕНИЕ НАВИГАЦИЕЙ
// ============================================

/**
 * Список страниц приложения
 * Каждая страница содержит:
 *   - id: идентификатор DOM-элемента страницы
 *   - buttonText: текст на кнопке
 *   - buttonIcon: иконка для кнопки
 *   - buttonId: идентификатор кнопки (для отладки)
 */
const pages = [
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
        id: 'page-spread',
        buttonText: 'Получить расклад «Прыжок Хекет»',
        buttonIcon: '🔮',
        buttonId: 'nav-to-spread'
    }
];

/**
 * Создаёт кнопки навигации и добавляет их в DOM
 * Кнопка текущей страницы не отображается
 */
function createNavButtons() {
    const navContainer = document.getElementById('nav-buttons');
    if (!navContainer) {
        console.error('Ошибка: контейнер nav-buttons не найден');
        return;
    }
    
    navContainer.innerHTML = '';
    const activePageId = getActivePageId();
    
    pages.forEach(page => {
        if (page.id !== activePageId) {
            const button = document.createElement('button');
            button.className = 'nav-btn';
            button.id = page.buttonId;
            button.onclick = () => switchToPage(page.id);
            button.innerHTML = `${page.buttonIcon} ${page.buttonText}`;
            navContainer.appendChild(button);
        }
    });
}

/**
 * Переключает на указанную страницу
 * @param {string} pageId - ID страницы (например, 'page-welcome')
 */
function switchToPage(pageId) {
    // Скрываем все страницы
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => page.classList.remove('active-page'));
    
    // Показываем нужную страницу
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active-page');
    
    // Если перешли на страницу расклада
    if (pageId === 'page-spread') {
    // Ждём следующего кадра анимации, чтобы DOM точно отрисовался
    requestAnimationFrame(() => {
        if (typeof initQuestionModule === 'function') {
            initQuestionModule();
        }
    });
}
    
    // Обновляем навигационные кнопки
    createNavButtons();
    
    // Прокручиваем страницу вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
}