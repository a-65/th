// ============================================
// modules/utils.js — УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Флаг блокировки для защиты от двойного нажатия
 */
let isProcessing = false;

/**
 * Защита от двойного нажатия
 * Оборачивает функцию, блокируя повторные вызовы на 500 мс
 * @param {Function} callback - функция, которую нужно защитить
 * @returns {Function} - обёрнутая функция
 */
function withLock(callback) {
    return function(...args) {
        if (isProcessing) return;
        isProcessing = true;
        try {
            callback.apply(this, args);
        } finally {
            setTimeout(() => { isProcessing = false; }, 500);
        }
    };
}

/**
 * Возвращает ID текущей активной страницы
 * @returns {string} - ID активной страницы (например, 'page-welcome')
 */
function getActivePageId() {
    const activePage = document.querySelector('.page.active-page');
    return activePage ? activePage.id : 'page-welcome';
}