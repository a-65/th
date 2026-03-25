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
    
    // Создаём кнопки навигации (функция из модуля navigation.js)
    if (typeof createNavButtons === 'function') {
        createNavButtons();
    }
    
    console.log('✅ Приложение инициализировано');
}

// Запускаем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', initApp);