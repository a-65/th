(() => {
    // ============================================
    // modules/deck.js — УПРАВЛЕНИЕ КОЛОДАМИ ДЛЯ АУТЕНТИЧНОГО РАСКЛАДА
    // ============================================

    // --------------------------------------------
    // 1. СОСТОЯНИЕ РАСКЛАДА
    // --------------------------------------------
    let currentPart = 'part1';           // 'part1' или 'part2' — текущая активная часть
    let selectedCardsPart1 = [];          // Выбранные карты для первой части (максимум 5)
    let selectedCardsPart2 = [];          // Выбранные карты для второй части (максимум 5)
    let shuffleAudio = null;

    // --------------------------------------------
    // 2. КОНСТАНТЫ ПУТЕЙ И НАСТРОЕК
    // --------------------------------------------
    const SHUFFLE_SOUND_SRC = 'sounds/shuffle.mp3';
    const CARD_IMAGES_BASE_PATH = '../images';
    const CARD_IMAGE_EXTENSION = 'jpg';
    const FALLBACK_CARD_IMAGE_SRC = `${CARD_IMAGES_BASE_PATH}/book_thoth.${CARD_IMAGE_EXTENSION}`;
    const SHUFFLE_VOLUME = 0.8;          // 80% громкости

    // --------------------------------------------
    // 3. ДАННЫЕ КОЛОД
    // --------------------------------------------
    let majorDeck = [];                   // Старшие Арканы (22 карты, id 0-21)
    let minorDeck = [];                   // Остальные карты (56 карт, id 22-77)
    let currentDeckCards = [];            // Текущие карты в колоде (для отображения)

    // --------------------------------------------
    // 4. КЕШИРУЕМЫЕ DOM-ЭЛЕМЕНТЫ
    // --------------------------------------------
    let deckContainer = null;             // Контейнер всей колоды
    let part1Grid = null;                 // Сетка позиций первой части
    let part2Grid = null;                 // Сетка позиций второй части
    let shuffleBtn = null;                // Кнопка тасовки
    let deckTitleElement = null;          // Заголовок колоды
    let deckCardsContainer = null;        // Контейнер для карт в колоде
    let remainingCountElement = null;     // Счётчик оставшихся карт
    let selectedCountElement = null;      // Счётчик выбранных карт

    // Дополнительные элементы страницы выбора карт
    let spreadPositionsElement = null;    // .spread-positions
    let deckStatsElement = null;          // #deck-stats
    let part1ContainerElement = null;     // #part1-positions
    let part2ContainerElement = null;     // #part2-positions
    let partOneDescriptionElement = null; // #partOneDescription
    let partTwoDescriptionElement = null; // #partTwoDescription

    // Элементы страницы результата
    let resultPart1Grid = null;
    let resultPart2Grid = null;
    let resultPartOneDescription = null;
    let resultPartTwoDescription = null;
    let resultQuestionSpan = null;

    // --------------------------------------------
    // 5. ФЛАГИ СОСТОЯНИЯ
    // --------------------------------------------
    let isShuffling = false;              // Блокировка во время тасовки
    let isSpreadStarted = false;          // Начат ли выбор карт

    // ============================================
    // 6. ПРИВЯЗКА К DOM И СБРОС UI
    // ============================================

    /**
     * Находит все нужные DOM-элементы и сохраняет их в переменные.
     * Вызывается один раз при инициализации модуля.
     * @returns {boolean} true, если все элементы найдены
     */
    function bindDeckDomElements() {
        deckContainer = document.getElementById('deck-container');
        part1Grid = document.getElementById('select-part1-grid');
        part2Grid = document.getElementById('select-part2-grid');
        deckTitleElement = document.getElementById('deck-title');
        deckCardsContainer = document.getElementById('deck-cards');
        shuffleBtn = document.getElementById('shuffle-btn');
        remainingCountElement = document.getElementById('remaining-count');
        selectedCountElement = document.getElementById('selected-count');

        spreadPositionsElement = document.querySelector('.spread-positions');
        deckStatsElement = document.getElementById('deck-stats');
        part1ContainerElement = document.getElementById('part1-positions');
        part2ContainerElement = document.getElementById('part2-positions');
        partOneDescriptionElement = document.getElementById('partOneDescription');
        partTwoDescriptionElement = document.getElementById('partTwoDescription');

        return Boolean(
            deckContainer &&
            part1Grid &&
            part2Grid &&
            deckTitleElement &&
            deckCardsContainer &&
            shuffleBtn &&
            remainingCountElement &&
            selectedCountElement &&
            spreadPositionsElement &&
            deckStatsElement &&
            part1ContainerElement &&
            part2ContainerElement &&
            partOneDescriptionElement &&
            partTwoDescriptionElement
        );
    }

    /**
     * Привязывает DOM-элементы страницы результата.
     * Вызывается один раз при восстановлении расклада.
     * @returns {boolean} true, если все элементы найдены
     */
    function bindResultDomElements() {
        resultPart1Grid = document.getElementById('result-part1-grid');
        resultPart2Grid = document.getElementById('result-part2-grid');
        resultPartOneDescription = document.getElementById('result-partOneDescription');
        resultPartTwoDescription = document.getElementById('result-partTwoDescription');
        resultQuestionSpan = document.getElementById('result-displayed-question');

        return Boolean(
            resultPart1Grid &&
            resultPart2Grid &&
            resultPartOneDescription &&
            resultPartTwoDescription &&
            resultQuestionSpan
        );
    }

    /**
     * Сбрасывает визуальное состояние колоды к начальному.
     * Не изменяет данные расклада.
     */
    function resetDeckUi() {
        if (deckTitleElement) {
            deckTitleElement.textContent = '🃟 Старшие Арканы';
        }
        if (deckCardsContainer) {
            deckCardsContainer.innerHTML = '';
        }
        if (remainingCountElement) {
            remainingCountElement.textContent = '22';
        }
        if (selectedCountElement) {
            selectedCountElement.textContent = '0 / 5';
        }
        if (shuffleBtn) {
            shuffleBtn.disabled = false;
            shuffleBtn.onclick = () => shuffleDeck();
        }
    }

    // ============================================
    // 7. HELPER-ФУНКЦИИ ДЛЯ ЧАСТЕЙ РАСКЛАДА
    // ============================================

    function getGridByPart(part) {
        return part === 'part1' ? part1Grid : part2Grid;
    }

    function getPositionTitleByPart(part, index) {
        return part === 'part1'
            ? getPart1PositionTitle(index)
            : getPart2PositionTitle(index);
    }

    function getDescriptionElementByPart(part) {
        return part === 'part1'
            ? partOneDescriptionElement
            : partTwoDescriptionElement;
    }

    function setPartDescription(part, text) {
        const descElement = getDescriptionElementByPart(part);
        if (descElement) {
            descElement.textContent = text;
        }
    }

    // ============================================
    // 8. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПУТЕЙ
    // ============================================

    function getCardImagePath(cardId) {
        return `${CARD_IMAGES_BASE_PATH}/${cardId}.${CARD_IMAGE_EXTENSION}`;
    }

    function getFallbackCardImagePath() {
        return FALLBACK_CARD_IMAGE_SRC;
    }

    function createShuffleAudio() {
        const audio = new Audio(SHUFFLE_SOUND_SRC);
        audio.volume = SHUFFLE_VOLUME;
        return audio;
    }

    // ============================================
    // 9. ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
    // ============================================

    function initDeckModule() {
        console.log('🃟 Инициализация модуля колод');

        if (!bindDeckDomElements()) {
            console.error('Ошибка: не найдены элементы для колод');
            return false;
        }

        resetDeckUi();

        if (!shuffleAudio) {
            initShuffleSound();
        }

        if (restoreSavedSpread()) {
            console.log('✅ Модуль колод: восстановлен сохранённый расклад');
            setTimeout(() => {
                requestAnimationFrame(() => alignDeckHeight());
            }, 100);
            return true;
        }

        console.log('🃟 Создаём новый расклад...');

        selectedCardsPart1 = [];
        selectedCardsPart2 = [];
        currentPart = 'part1';

        initDecks();
        createEmptyPositions();

        if (part1ContainerElement) part1ContainerElement.style.display = 'block';
        if (part2ContainerElement) part2ContainerElement.style.display = 'block';

        if (typeof PART_ONE_DESCRIPTION !== 'undefined') {
            setPartDescription('part1', PART_ONE_DESCRIPTION);
            console.log('✅ Добавлено описание первой части');
        }
        if (typeof PART_TWO_DESCRIPTION !== 'undefined') {
            setPartDescription('part2', PART_TWO_DESCRIPTION);
            console.log('✅ Добавлено описание второй части');
        }

        showPart1();

        isSpreadStarted = true;
        console.log('✅ Модуль колод инициализирован, можно начинать выбор');

        setTimeout(() => {
            requestAnimationFrame(() => alignDeckHeight());
        }, 100);

        return true;
    }

    // ============================================
    // 10. РАБОТА С КОЛОДАМИ
    // ============================================

    function initDecks() {
        majorDeck = tarotDeck
            .filter(card => card.id >= 0 && card.id <= 21)
            .map(card => ({ ...card, isReversed: false, isSelected: false }));

        minorDeck = tarotDeck
            .filter(card => card.id >= 22 && card.id <= 77)
            .map(card => ({ ...card, isReversed: false, isSelected: false }));

        console.log(`🃟 Колоды созданы: Старшие Арканы — ${majorDeck.length} карт, остальные — ${minorDeck.length} карт`);
    }

    function createEmptyPositions() {
        if (part1Grid) {
            part1Grid.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const emptySlot = createEmptySlot(getPositionTitleByPart('part1', i));
                part1Grid.appendChild(emptySlot);
            }
        }
        if (part2Grid) {
            part2Grid.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const emptySlot = createEmptySlot(getPositionTitleByPart('part2', i));
                part2Grid.appendChild(emptySlot);
            }
        }
    }

    function createEmptySlot(title) {
        const div = document.createElement('div');
        div.className = 'empty-position';
        div.setAttribute('data-position', title);
        const p = document.createElement('p');
        p.textContent = title;
        div.appendChild(p);
        return div;
    }

    function getPart1PositionTitle(index) {
        const titles = [
            '🔹 Будущее', '🔹 Настоящее', '🔹 Прошлое',
            '🔹 Содействие', '🔹 Противодействие'
        ];
        return titles[index];
    }

    function getPart2PositionTitle(index) {
        const titles = [
            '🔹 Дом Целей', '🔹 Дом Мысли', '🔹 Дом Бремени',
            '🔹 Дом Силы и Поддержки', '🔹 Дом Контроля и Подавления'
        ];
        return titles[index];
    }

    // ============================================
    // 11. РЕНДЕР И СТАТИСТИКА
    // ============================================

    function renderDeck(cards) {
        if (!deckCardsContainer) return;
        deckCardsContainer.innerHTML = '';
        cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'deck-card';
            cardElement.setAttribute('data-card-id', card.id);
            cardElement.setAttribute('data-card-index', index);
            cardElement.onclick = () => selectCard(index);
            deckCardsContainer.appendChild(cardElement);
        });
        updateStats();
    }

    function updateStats() {
        if (!remainingCountElement || !selectedCountElement) return;
        remainingCountElement.textContent = currentDeckCards.length;
        const selectedCount = currentPart === 'part1'
            ? selectedCardsPart1.length
            : selectedCardsPart2.length;
        selectedCountElement.textContent = `${selectedCount} / 5`;
    }

    // ============================================
    // 12. ПОКАЗ ЧАСТЕЙ РАСКЛАДА
    // ============================================

    function showPart1() {
        currentPart = 'part1';
        currentDeckCards = majorDeck.map(card => ({ ...card, isReversed: false, isSelected: false }));
        shuffleDeck(true);
        if (deckTitleElement) {
            deckTitleElement.textContent = '🃟 Старшие Арканы (22 карты)';
        }
        console.log('🃟 Показана первая часть расклада, колода перетасована');
        setTimeout(() => requestAnimationFrame(() => alignDeckHeight()), 150);
    }

    function showPart2() {
        currentPart = 'part2';
        currentDeckCards = minorDeck.map(card => ({ ...card, isReversed: false, isSelected: false }));
        shuffleDeck(true);
        if (deckTitleElement) {
            deckTitleElement.textContent = '🃟 Остальные карты (56 карт)';
        }
        updateStats();
        if (shuffleBtn) {
            shuffleBtn.disabled = false;
        }
        isShuffling = false;
        console.log('🃟 Показана вторая часть расклада, колода перетасована');
        setTimeout(() => requestAnimationFrame(() => alignDeckHeight()), 150);
    }

    // ============================================
    // 13. ТАСОВКА
    // ============================================

    function shuffleDeck(isInitial = false) {
        if (isShuffling) {
            console.warn('Тасовка уже выполняется');
            return;
        }
        console.log('🃟 Тасуем колоду...');
        isShuffling = true;
        if (!isInitial && shuffleBtn) shuffleBtn.disabled = true;
        if (deckCardsContainer) deckCardsContainer.classList.add('shuffling');
        playShuffleSound();
        setTimeout(() => {
            currentDeckCards = currentDeckCards.map(card => ({ ...card, isReversed: Math.random() < 0.5 }));
            for (let i = currentDeckCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentDeckCards[i], currentDeckCards[j]] = [currentDeckCards[j], currentDeckCards[i]];
            }
            renderDeck(currentDeckCards);
            if (deckCardsContainer) deckCardsContainer.classList.remove('shuffling');
            if (!isInitial && shuffleBtn) shuffleBtn.disabled = false;
            isShuffling = false;
            console.log('🃟 Колода перетасована');
        }, 3000);
    }

    // ============================================
    // 14. ЗВУКОВЫЕ ЭФФЕКТЫ
    // ============================================

    function initShuffleSound() {
        try {
            shuffleAudio = createShuffleAudio();
            shuffleAudio.load();
            console.log('🔊 Звук тасовки предзагружен');
        } catch (e) {
            console.warn('⚠️ Ошибка при загрузке звука:', e);
        }
    }

    function playShuffleSound() {
        if (shuffleAudio) {
            shuffleAudio.currentTime = 0;
            shuffleAudio.play().catch(e => console.log('🔇', e));
        } else {
            const audio = createShuffleAudio();
            audio.play().catch(e => console.log('🔇', e));
        }
    }

    // ============================================
    // 15. ВЫБОР КАРТ И ПОЗИЦИИ
    // ============================================

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
        const selectedCount = currentPart === 'part1' ? selectedCardsPart1.length : selectedCardsPart2.length;
        if (selectedCount >= 5) {
            console.warn('Уже выбрано 5 карт для этой части');
            return;
        }
        if (selectedCount === 0 && shuffleBtn) shuffleBtn.disabled = true;
        console.log(`🃟 Выбрана карта: ${card.name} (${card.isReversed ? 'перевёрнутая' : 'прямая'})`);
        card.isSelected = true;
        currentDeckCards.splice(index, 1);
        if (currentPart === 'part1') {
            selectedCardsPart1.push(card);
            addCardToPosition(card, selectedCardsPart1.length - 1, 'part1');
        } else {
            selectedCardsPart2.push(card);
            addCardToPosition(card, selectedCardsPart2.length - 1, 'part2');
        }
        renderDeck(currentDeckCards);
        requestAnimationFrame(() => alignDeckHeight());
        const newSelectedCount = currentPart === 'part1' ? selectedCardsPart1.length : selectedCardsPart2.length;
        if (newSelectedCount === 5) onPartComplete();
    }

    function addCardToPosition(card, positionIndex, part) {
        const grid = getGridByPart(part);
        if (!grid) return;
        const cardElement = createCardElementForSpread(card, part, positionIndex);
        const children = grid.children;
        if (children[positionIndex]) {
            grid.replaceChild(cardElement, children[positionIndex]);
        }
        requestAnimationFrame(() => {
            alignDeckHeight();
            requestAnimationFrame(() => alignDeckHeight());
        });
    }

    // ============================================
    // 16. СОЗДАНИЕ ЭЛЕМЕНТА КАРТЫ
    // ============================================

    function createCardElementForSpread(card, part, positionIndex) {
        const description = (typeof PART_ONE_POSITIONS !== 'undefined' || typeof PART_TWO_POSITIONS !== 'undefined')
            ? (part === 'part1'
                ? (PART_ONE_POSITIONS && PART_ONE_POSITIONS[positionIndex]) || getPositionTitleByPart(part, positionIndex)
                : (PART_TWO_POSITIONS && PART_TWO_POSITIONS[positionIndex]) || getPositionTitleByPart(part, positionIndex))
            : getPositionTitleByPart(part, positionIndex);

        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-position';

        const topContainer = document.createElement('div');
        topContainer.className = 'card-position-top';
        const positionP = document.createElement('p');
        positionP.textContent = description;
        topContainer.appendChild(positionP);

        const middleContainer = document.createElement('div');
        middleContainer.className = 'card-position-middle';
        const img = document.createElement('img');
        img.src = getCardImagePath(card.id);
        img.alt = card.name;
        img.className = 'card-image';
        img.onerror = function () {
            console.warn(`Изображение для карты ${card.id} (${card.name}) не найдено`);
            this.src = getFallbackCardImagePath();
            this.alt = `Изображение отсутствует: ${card.name}`;
        };
        if (card.isReversed) img.classList.add('reversed');
        middleContainer.appendChild(img);

        const bottomContainer = document.createElement('div');
        bottomContainer.className = 'card-position-bottom';
        const descDiv = document.createElement('div');
        descDiv.className = 'card-description';
        descDiv.textContent = `${card.name}: ${card.isReversed ? card.reversed : card.upright}`;
        bottomContainer.appendChild(descDiv);

        cardDiv.appendChild(topContainer);
        cardDiv.appendChild(middleContainer);
        cardDiv.appendChild(bottomContainer);
        return cardDiv;
    }

    // ============================================
    // 17. ЗАВЕРШЕНИЕ ЧАСТЕЙ РАСКЛАДА
    // ============================================

    function onPartComplete() {
        if (currentPart === 'part1') {
            console.log('✅ Первая часть завершена! Переход ко второй части...');
            showPart2();
            setTimeout(() => requestAnimationFrame(() => alignDeckHeight()), 100);
        } else {
            console.log('✅ Весь расклад завершён!');
            onSpreadComplete();
        }
    }

    function onSpreadComplete() {
        console.log('🎉 Расклад завершён! Переход на страницу результата...');
        saveCompleteSpread();
        if (typeof window.goToResultPage === 'function') {
            window.goToResultPage();
        } else {
            console.error('Ошибка: функция goToResultPage не найдена');
        }
    }

    function saveCompleteSpread() {
        const currentQuestion = localStorage.getItem('tarot_last_question') || '';
        const spreadData = {
            question: currentQuestion,
            timestamp: Date.now(),
            part1: selectedCardsPart1.map(card => ({ id: card.id, name: card.name, upright: card.upright, reversed: card.reversed, isReversed: card.isReversed })),
            part2: selectedCardsPart2.map(card => ({ id: card.id, name: card.name, upright: card.upright, reversed: card.reversed, isReversed: card.isReversed }))
        };
        localStorage.setItem('tarot_last_complete_spread', JSON.stringify(spreadData));
        localStorage.setItem('tarot_last_question', currentQuestion);
        console.log('💾 Расклад сохранён');
    }

    // ============================================
    // 18. ВОССТАНОВЛЕНИЕ РАСКЛАДА
    // ============================================

    function restoreSavedSpread() {
        const savedSpread = localStorage.getItem('tarot_last_complete_spread');
        if (!savedSpread) return false;
        try {
            const spreadData = JSON.parse(savedSpread);
            if (!spreadData.part1 || !spreadData.part2) return false;
            console.log('🔄 Восстанавливаем сохранённый расклад...');
            selectedCardsPart1 = spreadData.part1.map(card => ({ ...card, isReversed: card.isReversed || false, isSelected: true }));
            selectedCardsPart2 = spreadData.part2.map(card => ({ ...card, isReversed: card.isReversed || false, isSelected: true }));
            restoreCardsToPositions(selectedCardsPart1, 'part1');
            restoreCardsToPositions(selectedCardsPart2, 'part2');
            if (typeof PART_ONE_DESCRIPTION !== 'undefined') setPartDescription('part1', PART_ONE_DESCRIPTION);
            if (typeof PART_TWO_DESCRIPTION !== 'undefined') setPartDescription('part2', PART_TWO_DESCRIPTION);
            console.log('✅ Расклад восстановлен');
            return true;
        } catch (e) {
            console.warn('Ошибка восстановления расклада:', e);
            return false;
        }
    }

    function restoreCardsToPositions(cards, part) {
        const grid = getGridByPart(part);
        if (!grid) return;
        grid.innerHTML = '';
        cards.forEach((card, index) => {
            const cardElement = createCardElementForSpread(card, part, index);
            grid.appendChild(cardElement);
        });
        setTimeout(() => requestAnimationFrame(() => alignDeckHeight()), 50);
    }

    // ============================================
    // 19. ВЫРАВНИВАНИЕ ВЫСОТЫ КОЛОДЫ
    // ============================================

    function alignDeckHeight() {
        if (!deckContainer || !spreadPositionsElement) return;
        const positionsHeight = spreadPositionsElement.offsetHeight;
        deckContainer.style.height = positionsHeight + 'px';
        if (deckCardsContainer) {
            let otherHeight = 0;
            if (deckTitleElement) otherHeight += deckTitleElement.offsetHeight;
            if (deckStatsElement) otherHeight += deckStatsElement.offsetHeight;
            if (shuffleBtn) otherHeight += shuffleBtn.offsetHeight;
            otherHeight += 95;
            const cardsMaxHeight = positionsHeight - otherHeight;
            deckCardsContainer.style.maxHeight = Math.max(cardsMaxHeight, 200) + 'px';
            deckCardsContainer.style.overflowY = 'auto';
        }
    }

    // ============================================
    // 20. ВОССТАНОВЛЕНИЕ НА СТРАНИЦЕ РЕЗУЛЬТАТА
    // ============================================

    function restoreResultSpread() {
        const savedSpread = localStorage.getItem('tarot_last_complete_spread');
        if (!savedSpread) {
            console.warn('⚠️ Нет сохранённого расклада');
            return false;
        }

        if (!bindResultDomElements()) {
            console.error('❌ Сетки для карт результата не найдены');
            return false;
        }

        try {
            const spreadData = JSON.parse(savedSpread);
            if (!spreadData.part1 || !spreadData.part2) return false;

            console.log('🔄 Восстанавливаем расклад на странице результата...');

            if (resultQuestionSpan && spreadData.question) {
                resultQuestionSpan.textContent = spreadData.question;
                console.log('📝 Вопрос восстановлен:', spreadData.question);
            }

            if (typeof PART_ONE_DESCRIPTION !== 'undefined') {
                resultPartOneDescription.textContent = PART_ONE_DESCRIPTION;
            }
            if (typeof PART_TWO_DESCRIPTION !== 'undefined') {
                resultPartTwoDescription.textContent = PART_TWO_DESCRIPTION;
            }

            resultPart1Grid.innerHTML = '';
            resultPart2Grid.innerHTML = '';

            spreadData.part1.forEach((card, index) => {
                const cardElement = createCardElementForSpread(card, 'part1', index);
                resultPart1Grid.appendChild(cardElement);
            });

            spreadData.part2.forEach((card, index) => {
                const cardElement = createCardElementForSpread(card, 'part2', index);
                resultPart2Grid.appendChild(cardElement);
            });

            console.log(`✅ Восстановлено ${spreadData.part1.length} + ${spreadData.part2.length} карт`);
            return true;

        } catch (e) {
            console.warn('Ошибка восстановления расклада:', e);
            return false;
        }
    }

    // ============================================
    // 21. СБРОС МОДУЛЯ
    // ============================================

    function resetDeckModule() {
        console.log('🃟 Сброс состояния колод...');
        selectedCardsPart1 = [];
        selectedCardsPart2 = [];
        currentDeckCards = [];
        currentPart = 'part1';
        if (part1Grid) part1Grid.innerHTML = '';
        if (part2Grid) part2Grid.innerHTML = '';
        resetDeckUi();
        isShuffling = false;
        isSpreadStarted = false;
        console.log('✅ Состояние колод сброшено');
    }

    // ============================================
    // 22. ЭКСПОРТ ПУБЛИЧНОГО API
    // ============================================

    window.initDeckModule = initDeckModule;
    window.resetDeckModule = resetDeckModule;
    window.alignDeckHeight = alignDeckHeight;
    window.restoreResultSpread = restoreResultSpread;

})();