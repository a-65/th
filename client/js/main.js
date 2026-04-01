// ============================================
// main.js — ТОЧКА ВХОДА ПРИЛОЖЕНИЯ
// ============================================

/**
 * Инициализация приложения
 * Вызывается после загрузки DOM
 */
function initApp() {
    console.log('🚀 TarotHub: инициализация приложения');
    
    // Заполняем страницы контентом из data.js
    const welcomeContent = document.getElementById('welcome-content');
    if (welcomeContent && typeof INTRO_TEXT !== 'undefined') {
        welcomeContent.innerHTML = INTRO_TEXT.replace(/\n/g, '<br>');
    }
    
    const historyContent = document.getElementById('history-content');
    if (historyContent && typeof HISTORY_TEXT !== 'undefined') {
        historyContent.innerHTML = HISTORY_TEXT.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
    
    const rulesContent = document.getElementById('rules-content');
    if (rulesContent && typeof HEQET_TEXT !== 'undefined') {
        rulesContent.innerHTML = HEQET_TEXT.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
    
    // Создаём кнопки навигации
    if (typeof createNavButtons === 'function') {
        createNavButtons();
    }

    // Инициализируем выезжающую панель
    initNavPanel();
    
    // Проверяем, есть ли сохранённый расклад
    const savedSpread = localStorage.getItem('tarot_last_complete_spread');
    if (savedSpread) {
        // Если есть сохранённый расклад — переходим на страницу результата
        console.log('🔄 Найден сохранённый расклад, переходим на страницу результата');
        if (typeof window.switchToPage === 'function') {
            window.switchToPage('page-result');
        }
    } else {
        // Если нет — показываем страницу приветствия
        console.log('🏠 Нет сохранённого расклада, показываем страницу приветствия');
        if (typeof window.switchToPage === 'function') {
            window.switchToPage('page-welcome');
        }
    }
    
    console.log('✅ Приложение инициализировано');
}

/**
 * Инициализирует выезжающую панель навигации
 */
function initNavPanel() {
    const navToggle = document.getElementById('nav-toggle');
    const navButtons = document.getElementById('nav-buttons');
    
    if (!navToggle || !navButtons) {
        console.warn('⚠️ Элементы для панели навигации не найдены');
        return;
    }
    
    // Создаём оверлей, если его нет
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.insertBefore(overlay, document.body.firstChild);
    }
    
    // Флаг для блокировки кликов во время анимации
    let isAnimating = false;
    
    /**
     * Открывает панель навигации
     */
    function openNav() {
        if (isAnimating) return;
        isAnimating = true;
        
        navButtons.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            isAnimating = false;
        }, 300);
    }
    
    /**
     * Закрывает панель навигации
     */
    function closeNav() {
        if (isAnimating) return;
        isAnimating = true;
        
        navButtons.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            isAnimating = false;
        }, 300);
    }
    
    /**
     * Переключает состояние панели навигации
     */
    function toggleNav() {
        if (isAnimating) return;
        
        const isOpen = navButtons.classList.contains('open');
        if (isOpen) {
            closeNav();
        } else {
            openNav();
        }
    }
    
    // Обработчик клика по кнопке ☰
    navToggle.addEventListener('click', toggleNav);
    
    // Обработчик клика по оверлею
    overlay.addEventListener('click', closeNav);
    
    // Обработчик клика по кнопкам в панели
    navButtons.addEventListener('click', (event) => {
        const btn = event.target.closest('.nav-btn');
        if (btn) {
            closeNav();
        }
    });
    
    // Обработчик нажатия Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navButtons.classList.contains('open')) {
            closeNav();
        }
    });
    
    console.log('✅ Панель навигации инициализирована');
}

// Запускаем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', initApp);