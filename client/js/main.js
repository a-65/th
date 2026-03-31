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

// Запускаем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', initApp);