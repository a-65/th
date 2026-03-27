// ============================================
// modules/deck.js — УПРАВЛЕНИЕ КОЛОДАМИ ДЛЯ АУТЕНТИЧНОГО РАСКЛАДА
// ============================================

/**
 * Состояние расклада
 */
let currentPart = 'part1';           // 'part1' или 'part2' — текущая активная часть
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
    
    // Находим DOM-элементы для страницы выбора карт (page-select)
    deckContainer = document.getElementById('deck-container');
    part1Grid = document.getElementById('select-part1-grid');
    part2Grid = document.getElementById('select-part2-grid');
    
    if (!deckContainer || !part1Grid || !part2Grid) {
        console.error('Ошибка: не найдены элементы для колод');
        return false;
    }
    
    // Проверка: если есть сохранённый расклад — восстанавливаем его
    if (restoreSavedSpread()) {
        console.log('✅ Модуль колод: восстановлен сохранённый расклад');
        // Выравниваем высоту колоды после восстановления
        setTimeout(() => {
            alignDeckHeight();
            requestAnimationFrame(() => alignDeckHeight());
        }, 100);
        return true;
    }
    
    // Если нет сохранённого расклада — создаём новый
    console.log('🃟 Создаём новый расклад...');
    
    // Сбрасываем выбранные карты
    selectedCardsPart1 = [];
    selectedCardsPart2 = [];
    currentPart = 'part1';
    
    // Создаём колоды
    initDecks();
    
    // Создаём пустые позиции в раскладе
    createEmptyPositions();
    
    // Показываем обе части расклада
    const part1Container = document.getElementById('part1-positions');
    const part2Container = document.getElementById('part2-positions');
    if (part1Container) part1Container.style.display = 'block';
    if (part2Container) part2Container.style.display = 'block';
    
    // Заполняем описания частей
    const partOneDescription = document.getElementById('partOneDescription');
    const partTwoDescription = document.getElementById('partTwoDescription');
    
    if (partOneDescription && typeof PART_ONE_DESCRIPTION !== 'undefined') {
        partOneDescription.textContent = PART_ONE_DESCRIPTION;
        console.log('✅ Добавлено описание первой части');
    }
    
    if (partTwoDescription && typeof PART_TWO_DESCRIPTION !== 'undefined') {
        partTwoDescription.textContent = PART_TWO_DESCRIPTION;
        console.log('✅ Добавлено описание второй части');
    }
    
    // Отображаем первую колоду
    showPart1();
    
    // Показываем кнопку тасовки и индикатор
    addDeckControls();
    
    isSpreadStarted = true;
    console.log('✅ Модуль колод инициализирован, можно начинать выбор');
    
    // Выравниваем высоту колоды после отрисовки
    setTimeout(() => {
        alignDeckHeight();
        requestAnimationFrame(() => alignDeckHeight());
    }, 100);
    
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
    
    // Футер (обёртка для статистики и кнопки)
    const footerDiv = document.createElement('div');
    footerDiv.className = 'deck-footer';
    
    // Индикатор (статистика)
    const statsDiv = document.createElement('div');
    statsDiv.className = 'deck-stats';
    statsDiv.id = 'deck-stats';
    statsDiv.innerHTML = `
        <p>📊 Осталось: <span id="remaining-count">22</span> карт</p>
        <p>✅ Выбрано: <span id="selected-count">0</span> из 5</p>
    `;
    footerDiv.appendChild(statsDiv);
    
    // Кнопка тасовки
    const shuffleButton = document.createElement('button');
    shuffleButton.className = 'shuffle-btn';
    shuffleButton.id = 'shuffle-btn';
    shuffleButton.textContent = '🔄 Перетасовать колоду';
    shuffleButton.onclick = () => shuffleDeck();
    footerDiv.appendChild(shuffleButton);
    
    controlsDiv.appendChild(footerDiv);
    
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
    const gridId = part === 'part1' ? 'select-part1-grid' : 'select-part2-grid';
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
 * Создаёт элемент карты для расклада (трёхчастная структура)
 * @param {Object} card - объект карты
 * @param {string} part - 'part1' или 'part2'
 * @param {number} positionIndex - индекс позиции (0-4)
 * @returns {HTMLElement}
 */
function createCardElementForSpread(card, part, positionIndex) {
    // Получаем ПОЛНОЕ описание позиции из глобальных массивов
    let positionDescription = '';
    
    if (part === 'part1') {
        if (typeof PART_ONE_POSITIONS !== 'undefined' && PART_ONE_POSITIONS[positionIndex]) {
            positionDescription = PART_ONE_POSITIONS[positionIndex];
        } else {
            positionDescription = getPart1PositionTitle(positionIndex);
        }
    } else {
        if (typeof PART_TWO_POSITIONS !== 'undefined' && PART_TWO_POSITIONS[positionIndex]) {
            positionDescription = PART_TWO_POSITIONS[positionIndex];
        } else {
            positionDescription = getPart2PositionTitle(positionIndex);
        }
    }
    
    // 1. Создаём главный контейнер карточки
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-position';
    
    // 2. Верхний мини-контейнер: ПОЛНОЕ описание позиции в раскладе
    const topContainer = document.createElement('div');
    topContainer.className = 'card-position-top';
    const positionP = document.createElement('p');
    positionP.textContent = positionDescription;
    topContainer.appendChild(positionP);
    
    // 3. Средний мини-контейнер: изображение карты
    const middleContainer = document.createElement('div');
    middleContainer.className = 'card-position-middle';
    const img = document.createElement('img');
    img.src = `../images/${card.id}.jpg`;
    img.alt = card.name;
    img.className = 'card-image';
    
    // Добавляем обработчик ошибки загрузки изображения
    img.onerror = function() {
        console.warn(`Изображение для карты ${card.id} (${card.name}) не найдено`);
        this.src = '../images/book_thoth.jpg';
        this.alt = `Изображение отсутствует: ${card.name}`;
    };
    
    // Если карта перевёрнутая, добавляем класс для поворота
    if (card.isReversed) {
        img.classList.add('reversed');
    }
    middleContainer.appendChild(img);
    
    // 4. Нижний мини-контейнер: описание значения карты
    const bottomContainer = document.createElement('div');
    bottomContainer.className = 'card-position-bottom';
    const descDiv = document.createElement('div');
    descDiv.className = 'card-description';
    
    // Выбираем правильное описание в зависимости от ориентации
    const cardValue = card.isReversed ? card.reversed : card.upright;
    descDiv.textContent = `${card.name}: ${cardValue}`;
    bottomContainer.appendChild(descDiv);
    
    // 5. Собираем карточку вместе
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
        showPart2();
    } else {
        console.log('✅ Весь расклад завершён!');
        onSpreadComplete();
    }
}

/**
 * Обработчик завершения всего расклада
 * Переход на страницу готового расклада (page-result)
 */
function onSpreadComplete() {
    console.log('🎉 Расклад завершён! Переход на страницу результата...');
    
    // Сохраняем расклад в localStorage
    saveCompleteSpread();
    
    // Переходим на страницу результата
    if (typeof window.goToResultPage === 'function') {
        const spreadData = {
            part1: selectedCardsPart1,
            part2: selectedCardsPart2
        };
        window.goToResultPage(spreadData);
    } else {
        console.error('Ошибка: функция goToResultPage не найдена');
    }
}

/**
 * Сохраняет завершённый расклад в localStorage
 */
function saveCompleteSpread() {
    const currentQuestion = localStorage.getItem('tarot_last_question') || '';
    
    console.log('💾 Сохраняем расклад...');
    console.log('  Вопрос:', currentQuestion);
    console.log('  Карты part1:', selectedCardsPart1.length);
    console.log('  Карты part2:', selectedCardsPart2.length);
    
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

/**
 * Сбрасывает состояние модуля колод (очищает выбор карт)
 */
function resetDeckModule() {
    console.log('🃟 Сброс состояния колод...');
    
    selectedCardsPart1 = [];
    selectedCardsPart2 = [];
    currentDeckCards = [];
    currentPart = 'part1';
    
    if (part1Grid) part1Grid.innerHTML = '';
    if (part2Grid) part2Grid.innerHTML = '';
    if (deckContainer) deckContainer.innerHTML = '';
    
    isShuffling = false;
    isSpreadStarted = false;
    
    console.log('✅ Состояние колод сброшено');
}

// ============================================
// ВОССТАНОВЛЕНИЕ РАСКЛАДА ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================

/**
 * Восстанавливает сохранённый расклад из localStorage
 * @returns {boolean} - успешно ли восстановлен расклад
 */
function restoreSavedSpread() {
    const savedSpread = localStorage.getItem('tarot_last_complete_spread');
    if (!savedSpread) return false;
    
    try {
        const spreadData = JSON.parse(savedSpread);
        if (!spreadData.part1 || !spreadData.part2) return false;
        
        console.log('🔄 Восстанавливаем сохранённый расклад...');
        
        selectedCardsPart1 = spreadData.part1.map(card => ({
            ...card,
            isReversed: card.isReversed || false,
            isSelected: true
        }));
        
        selectedCardsPart2 = spreadData.part2.map(card => ({
            ...card,
            isReversed: card.isReversed || false,
            isSelected: true
        }));
        
        restoreCardsToPositions(selectedCardsPart1, 'part1');
        restoreCardsToPositions(selectedCardsPart2, 'part2');
        
        // Добавляем описания частей
        const partOneDescription = document.getElementById('partOneDescription');
        const partTwoDescription = document.getElementById('partTwoDescription');
        
        if (partOneDescription && typeof PART_ONE_DESCRIPTION !== 'undefined') {
            partOneDescription.textContent = PART_ONE_DESCRIPTION;
            console.log('✅ Добавлено описание первой части (при восстановлении)');
        }
        
        if (partTwoDescription && typeof PART_TWO_DESCRIPTION !== 'undefined') {
            partTwoDescription.textContent = PART_TWO_DESCRIPTION;
            console.log('✅ Добавлено описание второй части (при восстановлении)');
        }
        
        console.log('✅ Расклад восстановлен');
        return true;
        
    } catch (e) {
        console.warn('Ошибка восстановления расклада:', e);
        return false;
    }
}

/**
 * Восстанавливает карты в позиции расклада
 * @param {Array} cards - массив карт
 * @param {string} part - 'part1' или 'part2'
 */
function restoreCardsToPositions(cards, part) {
    const gridId = part === 'part1' ? 'select-part1-grid' : 'select-part2-grid';
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    grid.innerHTML = '';
    
    cards.forEach((card, index) => {
        const cardElement = createCardElementForSpread(card, part, index);
        grid.appendChild(cardElement);
    });
}

/**
 * Восстанавливает расклад из localStorage (вызывается при загрузке страницы)
 * @returns {boolean} - успешно ли восстановлен расклад
 */
function restoreSpreadFromStorage() {
    console.log('🃟 Восстанавливаем расклад из storage...');
    
    const resultPart1Grid = document.getElementById('result-part1-grid');
    const resultPart2Grid = document.getElementById('result-part2-grid');
    
    if (resultPart1Grid && resultPart2Grid) {
        part1Grid = resultPart1Grid;
        part2Grid = resultPart2Grid;
        
        if (restoreSavedSpread()) {
            console.log('✅ Расклад восстановлен на странице результата');
            return true;
        }
    }
    
    return false;
}

// ============================================
// ВЫРАВНИВАНИЕ ВЫСОТЫ КОЛОДЫ
// ============================================

/**
 * Выравнивает высоту колоды по высоте левой части
 */
function alignDeckHeight() {
    const spreadPositions = document.querySelector('.spread-positions');
    const deckContainerElem = document.querySelector('.deck-container');
    
    if (spreadPositions && deckContainerElem) {
        const positionsHeight = spreadPositions.offsetHeight;
        deckContainerElem.style.height = positionsHeight + 'px';
        console.log(`📐 Высота колоды установлена: ${positionsHeight}px (равна высоте левой части)`);
        
        // Принудительно пересчитываем layout
        deckContainerElem.offsetHeight;
    }
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ДРУГИХ МОДУЛЕЙ
// ============================================

window.initDeckModule = initDeckModule;
window.createEmptySlot = createEmptySlot;
window.getPart1PositionTitle = getPart1PositionTitle;
window.getPart2PositionTitle = getPart2PositionTitle;
window.restoreSpreadFromStorage = restoreSpreadFromStorage;
window.resetDeckModule = resetDeckModule;
window.alignDeckHeight = alignDeckHeight;