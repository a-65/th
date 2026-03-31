// ============================================
// modules/navigation.js — УПРАВЛЕНИЕ НАВИГАЦИЕЙ
// ============================================

/**
 * Список всех страниц приложения
 */
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

/**
 * Список страниц, на которых НЕ нужно показывать кнопку «Получить расклад»
 */
const pagesWithoutGetSpread = ['page-select', 'page-result'];

/**
 * Создаёт кнопки навигации и добавляет их в DOM
 */
function createNavButtons() {
    const navContainer = document.getElementById('nav-buttons');
    if (!navContainer) {
        console.error('Ошибка: контейнер nav-buttons не найден');
        return;
    }
    
    // Очищаем контейнер
    navContainer.innerHTML = '';
    
    // Получаем ID текущей активной страницы
    const activePageId = getActivePageId();
    
    // Определяем, нужно ли скрывать кнопку «Получить расклад»
    const hideGetSpread = pagesWithoutGetSpread.includes(activePageId);
    
    // Создаём кнопки для всех страниц
    allPages.forEach(page => {
        // Пропускаем кнопку текущей страницы
        if (page.id === activePageId) {
            return;
        }
        
        // На промежуточных страницах пропускаем кнопку «Получить расклад»
        if (hideGetSpread && page.id === 'page-question') {
            return;
        }
        
        const button = document.createElement('button');
        button.className = 'nav-btn';
        button.id = page.buttonId;
        button.onclick = () => switchToPage(page.id);
        button.innerHTML = `${page.buttonIcon} ${page.buttonText}`;
        navContainer.appendChild(button);
    });
    
    console.log('✅ Навигационные кнопки созданы, активная страница:', activePageId);
    if (hideGetSpread) {
        console.log('🔘 Кнопка "Получить расклад" скрыта (промежуточная страница)');
    }
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
    const allPagesElements = document.querySelectorAll('.page');
    allPagesElements.forEach(page => page.classList.remove('active-page'));
    
    // 2. Показываем нужную страницу
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active-page');
    } else {
        console.error(`Ошибка: страница с id "${pageId}" не найдена`);
        return;
    }
    
    // 3. Специфическая инициализация в зависимости от страницы
    if (pageId === 'page-question') {
        // ========== НОВАЯ ПРОВЕРКА ==========
        // Если есть сохранённый расклад — перенаправляем на результат
        const savedSpread = localStorage.getItem('tarot_last_complete_spread');
        if (savedSpread) {
            console.log('🔄 Есть сохранённый расклад, перенаправляем на страницу результата');
            // Сначала показываем страницу результата
            const resultPage = document.getElementById('page-result');
            if (resultPage) {
                // Скрываем страницу вопроса
                if (targetPage) targetPage.classList.remove('active-page');
                // Показываем страницу результата
                resultPage.classList.add('active-page');
                // Восстанавливаем расклад
                if (typeof window.restoreResultSpread === 'function') {
                    window.restoreResultSpread();
                }
                // Обновляем навигационные кнопки
                createNavButtons();
            }
            return;
        }
        // ================================
        
        // Страница ввода вопроса — инициализируем модуль вопроса
        requestAnimationFrame(() => {
            if (typeof window.initQuestionModule === 'function') {
                console.log('🔄 Инициализация модуля вопроса на странице ввода вопроса');
                window.initQuestionModule();
            } else {
                console.warn('Функция initQuestionModule не найдена');
            }
        });
    }
    
    if (pageId === 'page-select') {
        requestAnimationFrame(() => {
            if (typeof window.displayQuestionOnSelectPage === 'function') {
                console.log('📝 Отображаем вопрос на странице выбора карт');
                window.displayQuestionOnSelectPage();
            } else {
                console.warn('Функция displayQuestionOnSelectPage не найдена');
            }

            // Инициализируем колоду
            if (typeof window.initDeckModule === 'function') {
                console.log('🃟 Инициализируем колоду на странице выбора карт');
                window.initDeckModule();
            } else {
                console.warn('Функция initDeckModule не найдена');
            }
        });
    }
    
    if (pageId === 'page-result') {
        requestAnimationFrame(() => {
            if (typeof window.restoreResultSpread === 'function') {
                console.log('🔄 Восстанавливаем расклад на странице результата');
                window.restoreResultSpread();
            } else {
                console.warn('⚠️ restoreResultSpread не найдена');
            }
            
            // Добавляем обработчик для кнопки «Новый вопрос»
            const newQuestionBtn = document.getElementById('new-question-from-result-btn');
            if (newQuestionBtn && !window._resultNewQuestionHandlerAttached) {
                newQuestionBtn.addEventListener('click', () => {
                    console.log('✏️ Новый вопрос — сброс расклада');
                    
                    // Очищаем localStorage
                    localStorage.removeItem('tarot_last_complete_spread');
                    localStorage.removeItem('tarot_last_question');
                    
                    // Сбрасываем модуль колод
                    if (typeof window.resetDeckModule === 'function') {
                        window.resetDeckModule();
                    }
                    
                    // Переходим на страницу ввода вопроса
                    if (typeof window.switchToPage === 'function') {
                        window.switchToPage('page-question');
                    }
                });
                window._resultNewQuestionHandlerAttached = true;
            }
        });
    }
    
    // 4. Создаём навигационные кнопки (учитывая текущую страницу)
    createNavButtons();
    
    // 5. Прокручиваем страницу вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log(`✅ Переключение на страницу "${pageId}" завершено`);
}

// ============================================
// НАВИГАЦИЯ МЕЖДУ СТРАНИЦАМИ РАСКЛАДА
// ============================================

/**
 * Переход на страницу выбора карт
 * @param {string} question - текст вопроса пользователя
 */
function goToSelectPage(question) {
    // Сохраняем вопрос в localStorage
    if (question && question.trim()) {
        localStorage.setItem('tarot_last_question', question.trim());
    }
    
    // Переключаемся на страницу выбора карт
    switchToPage('page-select');
}

/**
 * Переход на страницу готового расклада
 * @param {Object} spreadData - данные расклада (part1, part2)
 */
function goToResultPage() {
    // Данные уже сохранены в localStorage, просто переключаем страницу
    switchToPage('page-result');
}

/**
 * Возврат к вводу вопроса (уточнение вопроса)
 * Сбрасывает текущий прогресс выбора карт
 */
function goBackToQuestion() {
    console.log('✏️ Уточнить вопрос — возврат к форме');
    
    // Очищаем сохранённый расклад (промежуточный)
    localStorage.removeItem('tarot_last_complete_spread');
    
    // Сбрасываем состояние модуля колод
    if (typeof window.resetDeckModule === 'function') {
        window.resetDeckModule();
    }
    
    // Переключаемся на страницу ввода вопроса
    switchToPage('page-question');
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ДРУГИХ МОДУЛЕЙ
// ============================================

// Экспортируем функции навигации
window.goToSelectPage = goToSelectPage;
window.goToResultPage = goToResultPage;
window.goBackToQuestion = goBackToQuestion;