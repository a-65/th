// ============================================
// modules/deck.js — УПРАВЛЕНИЕ КОЛОДАМИ ДЛЯ АУТЕНТИЧНОГО РАСКЛАДА
// ============================================

/**
 * Состояние расклада
 */
let currentPart = 'part1';           // 'part1' или 'part2'
let selectedCardsPart1 = [];          // Выбранные карты для первой части (максимум 5)
let selectedCardsPart2 = [];          // Выбранные карты для второй части (максимум 5)

/**
 * Колоды
 */
let majorDeck = [];    // Старшие Арканы (22 карты, id 0-21)
let minorDeck = [];    // Остальные карты (56 карт, id 22-77)

/**
 * Временные массивы для отображения
 */
let currentDeckCards = [];    // Текущие карты в колоде (для отображения)

/**
 * DOM-элементы
 */
let deckContainer = null;      // Контейнер для колоды
let part1Grid = null;          // Сетка позиций первой части
let part2Grid = null;          // Сетка позиций второй части
let shuffleBtn = null;          // Кнопка тасовки
let statsElement = null;        // Элемент с индикатором (осталось/выбрано)

/**
 * Флаги состояния
 */
let isShuffling = false;        // Блокировка во время тасовки
let isSpreadStarted = false;     // Начат ли выбор карт

// ============================================
// ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
// ============================================

/**
 * Инициализирует модуль колод
 * Вызывается после того, как пользователь задал вопрос
 */
function initDeckModule() {
    console.log('🃟 Инициализация модуля колод');
    
    // Находим DOM-элементы
    deckContainer = document.getElementById('deck-container');
    part1Grid = document.getElementById('part1-grid');
    part2Grid = document.getElementById('part2-grid');
    
    if (!deckContainer || !part1Grid || !part2Grid) {
        console.error('Ошибка: не найдены элементы для колод');
        return false;
    }
    
    // Сбрасываем выбранные карты
    selectedCardsPart1 = [];
    selectedCardsPart2 = [];
    currentPart = 'part1';
    
    // Создаём колоды
    initDecks();
    
    // Создаём пустые позиции в раскладе
    createEmptyPositions();
    
    // Отображаем первую колоду
    showPart1();
    
    // Показываем кнопку тасовки и индикатор
    addDeckControls();
    
    isSpreadStarted = true;
    console.log('✅ Модуль колод инициализирован, можно начинать выбор');
    
    return true;
}

/**
 * Создаёт колоды из глобального массива tarotDeck
 */
function initDecks() {
    // Старшие Арканы (id 0-21)
    majorDeck = tarotDeck
        .filter(card => card.id >= 0 && card.id <= 21)
        .map(card => ({
            ...card,
            isReversed: false,     // начальное состояние — прямая
            isSelected: false      // не выбрана
        }));
    
    // Остальные карты (id 22-77)
    minorDeck = tarotDeck
        .filter(card => card.id >= 22 && card.id <= 77)
        .map(card => ({
            ...card,
            isReversed: false,
            isSelected: false
        }));
    
    console.log(`🃟 Колоды созданы: Старшие Арканы — ${majorDeck.length} карт, остальные — ${minorDeck.length} карт`);
}

/**
 * Создаёт пустые позиции для 5 карт в каждой части расклада
 */
function createEmptyPositions() {
    if (part1Grid) {
        part1Grid.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const emptySlot = createEmptySlot(getPart1PositionTitle(i));
            part1Grid.appendChild(emptySlot);
        }
    }
    
    if (part2Grid) {
        part2Grid.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const emptySlot = createEmptySlot(getPart2PositionTitle(i));
            part2Grid.appendChild(emptySlot);
        }
    }
}

/**
 * Создаёт элемент пустой позиции
 * @param {string} title - название позиции
 * @returns {HTMLElement}
 */
function createEmptySlot(title) {
    const div = document.createElement('div');
    div.className = 'empty-position';
    div.setAttribute('data-position', title);
    const p = document.createElement('p');
    p.textContent = title;
    div.appendChild(p);
    return div;
}

/**
 * Возвращает название позиции для первой части по индексу
 * @param {number} index - 0-4
 * @returns {string}
 */
function getPart1PositionTitle(index) {
    const titles = [
        '🔹 Будущее',
        '🔹 Настоящее',
        '🔹 Прошлое',
        '🔹 Содействие',
        '🔹 Противодействие'
    ];
    return titles[index];
}

/**
 * Возвращает название позиции для второй части по индексу
 * @param {number} index - 0-4
 * @returns {string}
 */
function getPart2PositionTitle(index) {
    const titles = [
        '🔹 Дом Целей',
        '🔹 Дом Мысли',
        '🔹 Дом Бремени',
        '🔹 Дом Силы и Поддержки',
        '🔹 Дом Контроля и Подавления'
    ];
    return titles[index];
}

/**
 * Добавляет элементы управления колодой (кнопка тасовки, индикатор)
 */
function addDeckControls() {
    // Создаём контейнер для управления
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'deck-controls';
    
    // Заголовок колоды
    const titleDiv = document.createElement('div');
    titleDiv.className = 'deck-title';
    titleDiv.id = 'deck-title';
    titleDiv.textContent = '🃟 Старшие Арканы';
    controlsDiv.appendChild(titleDiv);
    
    // Контейнер для карт
    const cardsDiv = document.createElement('div');
    cardsDiv.className = 'deck-cards';
    cardsDiv.id = 'deck-cards';
    controlsDiv.appendChild(cardsDiv);
    
    // Индикатор
    const statsDiv = document.createElement('div');
    statsDiv.className = 'deck-stats';
    statsDiv.id = 'deck-stats';
    statsDiv.innerHTML = `
        <p>📊 Осталось: <span id="remaining-count">22</span> карт</p>
        <p>✅ Выбрано: <span id="selected-count">0</span> из 5</p>
    `;
    controlsDiv.appendChild(statsDiv);
    
    // Кнопка тасовки
    const shuffleButton = document.createElement('button');
    shuffleButton.className = 'shuffle-btn';
    shuffleButton.id = 'shuffle-btn';
    shuffleButton.textContent = '🔄 Перетасовать колоду';
    shuffleButton.onclick = () => shuffleDeck();
    controlsDiv.appendChild(shuffleButton);
    
    // Очищаем и добавляем
    if (deckContainer) {
        deckContainer.innerHTML = '';
        deckContainer.appendChild(controlsDiv);
    }
    
    // Сохраняем ссылки
    statsElement = statsDiv;
    shuffleBtn = shuffleButton;
}

/**
 * Отображает карты в колоде
 * @param {Array} cards - массив карт для отображения
 */
function renderDeck(cards) {
    const cardsContainer = document.getElementById('deck-cards');
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    
    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'deck-card';
        cardElement.setAttribute('data-card-id', card.id);
        cardElement.setAttribute('data-card-index', index);
        cardElement.onclick = () => selectCard(index);
        cardsContainer.appendChild(cardElement);
    });
    
    // Обновляем индикатор
    updateStats();
}

/**
 * Обновляет индикатор (осталось/выбрано)
 */
function updateStats() {
    if (!statsElement) return;
    
    const remainingSpan = document.getElementById('remaining-count');
    const selectedSpan = document.getElementById('selected-count');
    
    if (remainingSpan) {
        remainingSpan.textContent = currentDeckCards.length;
    }
    
    if (selectedSpan) {
        const selectedCount = currentPart === 'part1' ? selectedCardsPart1.length : selectedCardsPart2.length;
        selectedSpan.textContent = `${selectedCount} / 5`;
    }
}

/**
 * Показывает первую часть расклада (Старшие Арканы)
 */
function showPart1() {
    currentPart = 'part1';
    
    // Копируем колоду Старших Арканов
    currentDeckCards = majorDeck.map(card => ({
        ...card,
        isReversed: false,
        isSelected: false
    }));
    
    // Сразу тасуем колоду (случайный порядок + перевёрнутость)
    shuffleDeck(true); // true = первый показ (без блокировки кнопки)
    
    const titleElement = document.getElementById('deck-title');
    if (titleElement) {
        titleElement.textContent = '🃟 Старшие Арканы (22 карты)';
    }
    
    // Показываем сетку первой части, скрываем вторую
    const part1Container = document.getElementById('part1-positions');
    const part2Container = document.getElementById('part2-positions');
    if (part1Container) part1Container.style.display = 'block';
    if (part2Container) part2Container.style.display = 'none';
    
    console.log('🃟 Показана первая часть расклада, колода перетасована');
}

/**
 * Показывает вторую часть расклада (остальные карты)
 */
function showPart2() {
    currentPart = 'part2';
    
    // Копируем колоду остальных карт
    currentDeckCards = minorDeck.map(card => ({
        ...card,
        isReversed: false,
        isSelected: false
    }));
    
    // Сразу тасуем колоду (случайный порядок + перевёрнутость)
    shuffleDeck(true); // true = первый показ (без блокировки кнопки)
    
    const titleElement = document.getElementById('deck-title');
    if (titleElement) {
        titleElement.textContent = '🃟 Остальные карты (56 карт)';
    }
    
    // Показываем сетку второй части, скрываем первую
    const part1Container = document.getElementById('part1-positions');
    const part2Container = document.getElementById('part2-positions');
    if (part1Container) part1Container.style.display = 'none';
    if (part2Container) part2Container.style.display = 'block';
    
    console.log('🃟 Показана вторая часть расклада, колода перетасована');
}

/**
 * Тасует текущую колоду
 * @param {boolean} isInitial - true при первом показе (не блокирует кнопку)
 */
function shuffleDeck(isInitial = false) {
    if (isShuffling) {
        console.warn('Тасовка уже выполняется');
        return;
    }
    
    console.log('🃟 Тасуем колоду...');
    isShuffling = true;
    
    // Блокируем кнопку только если это не первый показ
    if (!isInitial && shuffleBtn) {
        shuffleBtn.disabled = true;
    }
    
    // Добавляем анимацию
    const cardsContainer = document.getElementById('deck-cards');
    if (cardsContainer) {
        cardsContainer.classList.add('shuffling');
    }
    
    // Воспроизводим звук (если есть)
    playShuffleSound();
    
    // Выполняем тасовку
    setTimeout(() => {
        // Случайным образом определяем перевёрнутость каждой карты (50% шанс)
        currentDeckCards = currentDeckCards.map(card => ({
            ...card,
            isReversed: Math.random() < 0.5
        }));
        
        // Перемешиваем массив (алгоритм Фишера-Йетса)
        for (let i = currentDeckCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentDeckCards[i], currentDeckCards[j]] = [currentDeckCards[j], currentDeckCards[i]];
        }
        
        // Обновляем отображение
        renderDeck(currentDeckCards);
        
        // Убираем анимацию
        if (cardsContainer) {
            cardsContainer.classList.remove('shuffling');
        }
        
        // Разблокируем кнопку
        if (!isInitial && shuffleBtn) {
            shuffleBtn.disabled = false;
        }
        isShuffling = false;
        
        console.log('🃟 Колода перетасована');
    }, 1000);
}

/**
 * Воспроизводит звук тасовки
 */
function playShuffleSound() {
    // Временно заглушка — звук добавим позже
    // TODO: добавить звук shuffle.mp3
    console.log('🔊 Звук тасовки (пока заглушка)');
}

/**
 * Выбирает карту из колоды по индексу
 * @param {number} index - индекс карты в массиве currentDeckCards
 */
function selectCard(index) {
    if (isShuffling) {
        console.warn('Подождите, колода тасуется');
        return;
    }
    
    const card = currentDeckCards[index];
    if (!card || card.isSelected) {
        console.warn('Карта уже выбрана или не существует');
        return;
    }
    
    // Проверяем, сколько карт уже выбрано
    const selectedCount = currentPart === 'part1' ? selectedCardsPart1.length : selectedCardsPart2.length;
    if (selectedCount >= 5) {
        console.warn('Уже выбрано 5 карт для этой части');
        return;
    }

    // Если это первая карта в текущей части — блокируем кнопку тасовки
    if (selectedCount === 0 && shuffleBtn) {
        shuffleBtn.disabled = true;
        console.log('🔒 Кнопка тасовки заблокирована (первая карта выбрана)');
    }
    
    console.log(`🃟 Выбрана карта: ${card.name} (${card.isReversed ? 'перевёрнутая' : 'прямая'})`);
    
    // Отмечаем карту как выбранную
    card.isSelected = true;
    
    // Удаляем карту из текущей колоды
    currentDeckCards.splice(index, 1);
    
    // Добавляем карту в выбранные для текущей части
    if (currentPart === 'part1') {
        selectedCardsPart1.push(card);
        addCardToPosition(card, selectedCardsPart1.length - 1, 'part1');
    } else {
        selectedCardsPart2.push(card);
        addCardToPosition(card, selectedCardsPart2.length - 1, 'part2');
    }
    
    // Обновляем отображение колоды
    renderDeck(currentDeckCards);
    
    // Проверяем, завершена ли текущая часть
    const newSelectedCount = currentPart === 'part1' ? selectedCardsPart1.length : selectedCardsPart2.length;
    if (newSelectedCount === 5) {
        onPartComplete();
    }
}

/**
 * Добавляет карту в позицию расклада
 * @param {Object} card - объект карты
 * @param {number} positionIndex - индекс позиции (0-4)
 * @param {string} part - 'part1' или 'part2'
 */
function addCardToPosition(card, positionIndex, part) {
    const gridId = part === 'part1' ? 'part1-grid' : 'part2-grid';
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    // Создаём карточку карты (полноразмерную)
    const cardElement = createCardElementForSpread(card, part, positionIndex);
    
    // Заменяем пустую позицию на карточку
    const children = grid.children;
    if (children[positionIndex]) {
        grid.replaceChild(cardElement, children[positionIndex]);
    }
}

/**
 * Создаёт элемент карты для расклада
 * @param {Object} card - объект карты
 * @param {string} part - 'part1' или 'part2'
 * @param {number} positionIndex - индекс позиции
 * @returns {HTMLElement}
 */
function createCardElementForSpread(card, part, positionIndex) {
    const positionTitle = part === 'part1' 
        ? getPart1PositionTitle(positionIndex)
        : getPart2PositionTitle(positionIndex);
    
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-position';
    
    // Верхняя часть: описание позиции
    const topContainer = document.createElement('div');
    topContainer.className = 'card-position-top';
    const positionP = document.createElement('p');
    positionP.textContent = positionTitle;
    topContainer.appendChild(positionP);
    
    // Средняя часть: изображение карты
    const middleContainer = document.createElement('div');
    middleContainer.className = 'card-position-middle';
    const img = document.createElement('img');
    img.src = `../images/${card.id}.jpg`;
    img.alt = card.name;
    img.className = 'card-image';
    
    if (card.isReversed) {
        img.classList.add('reversed');
    }
    
    // Добавляем тултип при наведении (через атрибут title)
    const description = card.isReversed ? card.reversed : card.upright;
    img.title = `${card.name}\n\n${description}`;
    
    middleContainer.appendChild(img);
    
    // Нижняя часть: описание значения карты
    const bottomContainer = document.createElement('div');
    bottomContainer.className = 'card-position-bottom';
    const descDiv = document.createElement('div');
    descDiv.className = 'card-description';
    const cardValue = card.isReversed ? card.reversed : card.upright;
    descDiv.textContent = `${card.name}: ${cardValue}`;
    bottomContainer.appendChild(descDiv);
    
    // Собираем карточку
    cardDiv.appendChild(topContainer);
    cardDiv.appendChild(middleContainer);
    cardDiv.appendChild(bottomContainer);
    
    return cardDiv;
}

/**
 * Обработчик завершения части расклада
 */
function onPartComplete() {
    if (currentPart === 'part1') {
        console.log('✅ Первая часть завершена! Переход ко второй части...');
        // Показываем вторую часть
        showPart2();
    } else {
        console.log('✅ Весь расклад завершён!');
        onSpreadComplete();
    }
}

/**
 * Обработчик завершения всего расклада
 */
function onSpreadComplete() {
    console.log('🎉 Расклад завершён! Показываем полный расклад...');
    
    // Показываем обе части расклада
    const part1Container = document.getElementById('part1-positions');
    const part2Container = document.getElementById('part2-positions');
    
    if (part1Container) part1Container.style.display = 'block';
    if (part2Container) part2Container.style.display = 'block';
    
    // Скрываем колоду
    if (deckContainer) {
        deckContainer.style.display = 'none';
    }
    
    // Скрываем блок управления колодой
    const deckControls = document.querySelector('.deck-controls');
    if (deckControls) {
        deckControls.style.display = 'none';
    }
    
    // Показываем кнопки управления (Новый вопрос, Вернуться в меню)
    const spreadControls = document.getElementById('spread-controls');
    if (spreadControls) {
        spreadControls.style.display = 'flex';
    }
    
    // Прокручиваем страницу к началу расклада
    const spreadLayout = document.querySelector('.spread-layout');
    if (spreadLayout) {
        spreadLayout.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Сохраняем расклад в localStorage
    saveCompleteSpread();
    
    console.log('🎉 Полный расклад отображён, обе части видны');
}

/**
 * Сохраняет завершённый расклад в localStorage
 */
function saveCompleteSpread() {
    const currentQuestion = localStorage.getItem('tarot_last_question') || '';
    
    const spreadData = {
        question: currentQuestion,
        timestamp: Date.now(),
        part1: selectedCardsPart1.map(card => ({
            id: card.id,
            name: card.name,
            upright: card.upright,
            reversed: card.reversed,
            isReversed: card.isReversed
        })),
        part2: selectedCardsPart2.map(card => ({
            id: card.id,
            name: card.name,
            upright: card.upright,
            reversed: card.reversed,
            isReversed: card.isReversed
        }))
    };
    
    localStorage.setItem('tarot_last_complete_spread', JSON.stringify(spreadData));
    localStorage.setItem('tarot_last_question', currentQuestion);
    
    console.log('💾 Расклад сохранён в localStorage');
}

// ============================================
// ЭКСПОРТ ВСПОМОГАТЕЛЬНЫХ ФУНКЦИЙ
// ============================================

// Экспортируем функцию инициализации в глобальную область
window.initDeckModule = initDeckModule;

// Экспортируем функции для использования в question.js
window.createEmptySlot = createEmptySlot;
window.getPart1PositionTitle = getPart1PositionTitle;
window.getPart2PositionTitle = getPart2PositionTitle;