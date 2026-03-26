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
    
    // Очищаем контейнер перед созданием новых кнопок
    navContainer.innerHTML = '';
    
    // Получаем ID текущей активной страницы
    const activePageId = getActivePageId();
    
    // Создаём кнопки для всех страниц, кроме текущей
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
    
    console.log('✅ Навигационные кнопки созданы, активная страница:', activePageId);
}

/**
 * Возвращает ID текущей активной страницы
 * @returns {string} - ID активной страницы (например, 'page-welcome')
 */
function getActivePageId() {
    const activePage = document.querySelector('.page.active-page');
    return activePage ? activePage.id : 'page-welcome';
}

/**
 * Переключает на указанную страницу
 * @param {string} pageId - ID страницы (например, 'page-welcome')
 */
function switchToPage(pageId) {
    console.log(`🔄 Переключение на страницу: ${pageId}`);
    
    // 1. Скрываем все страницы
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => page.classList.remove('active-page'));
    
    // 2. Показываем нужную страницу
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active-page');
    } else {
        console.error(`Ошибка: страница с id "${pageId}" не найдена`);
        return;
    }
    
    // 3. Если перешли на страницу расклада — инициализируем модуль вопроса
    if (pageId === 'page-spread') {
        // Ждём следующего кадра анимации, чтобы DOM точно отрисовался
        requestAnimationFrame(() => {
            if (typeof window.initQuestionModule === 'function') {
                console.log('🔄 Инициализация модуля вопроса на странице расклада');
                window.initQuestionModule();
            } else {
                console.warn('Функция initQuestionModule не найдена');
            }
        });
        
        // ВРЕМЕННО: старый loadSpread() отключён — расклад теперь запускается через deck.js
        // if (typeof loadSpread === 'function') {
        //     loadSpread();
        // }
    }
    
    // 4. Обновляем навигационные кнопки (они зависят от текущей страницы)
    createNavButtons();
    
    // 5. Прокручиваем страницу вверх для удобства пользователя
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log(`✅ Переключение на страницу "${pageId}" завершено`);
}