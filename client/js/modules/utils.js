// ============================================
// modules/utils.js — УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Возвращает ID текущей активной страницы
 * @returns {string} - ID активной страницы (например, 'page-welcome')
 */
function getActivePageId() {
    const activePage = document.querySelector('.page.active-page');
    return activePage ? activePage.id : 'page-welcome';
}