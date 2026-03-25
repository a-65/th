// ============================================
// modules/spread.js — ЛОГИКА РАСКЛАДА
// ============================================

/**
 * Получает массив уникальных карт из указанного диапазона
 * @param {number} count - количество карт
 * @param {number} minId - минимальный ID карты (включительно)
 * @param {number} maxId - максимальный ID карты (включительно)
 * @returns {Array} - массив уникальных объектов карт
 */
function getUniqueCardsFromRange(count, minId, maxId) {
    const selectedCards = [];
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (selectedCards.length < count && attempts < maxAttempts) {
        const randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
        const card = tarotDeck.find(c => c.id === randomId);
        
        if (card) {
            const cardCopy = { ...card };
            const isReversed = Math.random() < 0.5;
            cardCopy.isReversed = isReversed;
            
            if (isReversed) {
                cardCopy.name += " (перевёрнутая)";
            }
            
            const isDuplicate = selectedCards.some(c => c.id === cardCopy.id);
            if (!isDuplicate) selectedCards.push(cardCopy);
        }
        attempts++;
    }
    
    if (attempts >= maxAttempts) {
        console.warn('Достигнуто максимальное количество попыток при выборе карт');
    }
    
    return selectedCards;
}

/**
 * Создаёт DOM-элемент карточки для одной карты
 * @param {Object} card - объект карты с полями id, name, upright, reversed, isReversed
 * @param {string} positionDescription - текст описания позиции в раскладе
 * @returns {HTMLElement} - элемент карточки
 */
function createCardElement(card, positionDescription) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-position';

    // Верхняя часть: описание позиции
    const topContainer = document.createElement('div');
    topContainer.className = 'card-position-top';
    const positionP = document.createElement('p');
    positionP.textContent = positionDescription;
    topContainer.appendChild(positionP);

    // Средняя часть: изображение карты
    const middleContainer = document.createElement('div');
    middleContainer.className = 'card-position-middle';
    const img = document.createElement('img');
    img.src = `../images/${card.id}.jpg`;
    img.alt = card.name;
    img.className = 'card-image';

    img.onerror = function() {
        console.warn(`Изображение для карты ${card.id} (${card.name}) не найдено`);
        this.src = '../images/book_thoth.jpg';
        this.alt = `Изображение отсутствует: ${card.name}`;
    };

    if (card.isReversed) {
        img.classList.add('reversed');
    }
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
 * Отображает массив карт в указанном контейнере
 * @param {Array} cardsArray - массив объектов карт
 * @param {Array} positionsArray - массив описаний позиций
 * @param {HTMLElement} containerElement - DOM-элемент для вставки
 */
function displayCards(cardsArray, positionsArray, containerElement) {
    if (cardsArray.length !== positionsArray.length) {
        console.error('Ошибка: массивы карт и позиций имеют разную длину');
        return;
    }

    containerElement.innerHTML = '';

    for (let i = 0; i < cardsArray.length; i++) {
        const card = cardsArray[i];
        const positionText = positionsArray[i];
        const cardElement = createCardElement(card, positionText);
        containerElement.appendChild(cardElement);
    }
}

/**
 * Загружает расклад на страницу spread
 */
function loadSpread() {
    console.log('🎴 Загружаем расклад "Прыжок Хекет"');
    
    const partOneCards = document.getElementById('partOneCards');
    const partTwoCards = document.getElementById('partTwoCards');
    const partOneDescription = document.getElementById('partOneDescription');
    const partTwoDescription = document.getElementById('partTwoDescription');
    
    if (!partOneCards || !partTwoCards) {
        console.error('Ошибка: не найдены контейнеры для карт');
        return;
    }
    
    // Очищаем старые карты
    partOneCards.innerHTML = '';
    partTwoCards.innerHTML = '';
    
    // Добавляем описания частей
    if (typeof PART_ONE_DESCRIPTION !== 'undefined') {
        partOneDescription.textContent = PART_ONE_DESCRIPTION;
    }
    if (typeof PART_TWO_DESCRIPTION !== 'undefined') {
        partTwoDescription.textContent = PART_TWO_DESCRIPTION;
    }
    
    // Получаем карты
    const firstPartCards = getUniqueCardsFromRange(5, 0, 21);
    const secondPartCards = getUniqueCardsFromRange(5, 22, 77);
    
    if (firstPartCards.length !== 5 || secondPartCards.length !== 5) {
        console.error('Ошибка: не удалось получить 5 карт для каждой части');
        return;
    }
    
    // Описания позиций
    let partOnePositions = [];
    let partTwoPositions = [];
    
    if (typeof PART_ONE_POSITIONS !== 'undefined' && PART_ONE_POSITIONS.length === 5) {
        partOnePositions = PART_ONE_POSITIONS;
    } else {
        partOnePositions = ['🔹 Позиция 1', '🔹 Позиция 2', '🔹 Позиция 3', '🔹 Позиция 4', '🔹 Позиция 5'];
    }
    
    if (typeof PART_TWO_POSITIONS !== 'undefined' && PART_TWO_POSITIONS.length === 5) {
        partTwoPositions = PART_TWO_POSITIONS;
    } else {
        partTwoPositions = ['🔹 Позиция 1', '🔹 Позиция 2', '🔹 Позиция 3', '🔹 Позиция 4', '🔹 Позиция 5'];
    }
    
    // Отображаем карты
    displayCards(firstPartCards, partOnePositions, partOneCards);
    displayCards(secondPartCards, partTwoPositions, partTwoCards);
}