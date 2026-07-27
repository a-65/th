(() => {
    // ============================================
    // modules/deck.js — УПРАВЛЕНИЕ КОЛОДАМИ ДЛЯ АУТЕНТИЧНОГО РАСКЛАДА
    // ============================================

    // --------------------------------------------
    // 1. СОСТОЯНИЕ РАСКЛАДА
    // --------------------------------------------
    let currentPart = 'part1';
    let selectedCardsPart1 = [];
    let selectedCardsPart2 = [];
    let shuffleAudio = null;

    // --------------------------------------------
    // 2. КОНСТАНТЫ ПУТЕЙ И НАСТРОЕК
    // --------------------------------------------
    const SHUFFLE_SOUND_SRC = 'sounds/shuffle.mp3';
    const CARD_IMAGES_BASE_PATH = '../images';
    const CARD_IMAGE_EXTENSION = 'jpg';
    const FALLBACK_CARD_IMAGE_SRC = `${CARD_IMAGES_BASE_PATH}/book_thoth.${CARD_IMAGE_EXTENSION}`;
    const SHUFFLE_VOLUME = 0.8;

    // --------------------------------------------
    // 3. ДАННЫЕ КОЛОД
    // --------------------------------------------
    let majorDeck = [];
    let minorDeck = [];
    let currentDeckCards = [];

    // --------------------------------------------
    // 4. КЕШИРУЕМЫЕ DOM-ЭЛЕМЕНТЫ СТРАНИЦЫ ВЫБОРА
    // --------------------------------------------
    let deckContainer = null;
    let part1Grid = null;
    let part2Grid = null;
    let shuffleBtn = null;
    let deckTitleElement = null;
    let deckCardsContainer = null;
    let deckStatsElement = null;
    let remainingCountElement = null;
    let selectedCountElement = null;

    let spreadPositionsElement = null;
    let part1ContainerElement = null;
    let part2ContainerElement = null;
    let partOneDescriptionElement = null;
    let partTwoDescriptionElement = null;

    // --------------------------------------------
    // 5. КЕШИРУЕМЫЕ DOM-ЭЛЕМЕНТЫ СТРАНИЦЫ РЕЗУЛЬТАТА
    // --------------------------------------------
    let resultPart1Grid = null;
    let resultPart2Grid = null;
    let resultPartOneDescriptionElement = null;
    let resultPartTwoDescriptionElement = null;
    let resultQuestionElement = null;

    // --------------------------------------------
    // 6. ФЛАГИ СОСТОЯНИЯ
    // --------------------------------------------
    let isShuffling = false;
    let isSpreadStarted = false;
    let isResultDomBound = false;

    // ============================================
    // 7. ПРИВЯЗКА К DOM
    // ============================================

    function bindSelectPageDomElements() {
        deckContainer = document.getElementById('deck-container');
        part1Grid = document.getElementById('select-part1-grid');
        part2Grid = document.getElementById('select-part2-grid');

        shuffleBtn = document.getElementById('shuffle-btn');
        deckTitleElement = document.getElementById('deck-title');
        deckCardsContainer = document.getElementById('deck-cards');
        deckStatsElement = document.getElementById('deck-stats');
        remainingCountElement = document.getElementById('remaining-count');
        selectedCountElement = document.getElementById('selected-count');

        spreadPositionsElement = document.querySelector('.spread-positions');
        part1ContainerElement = document.getElementById('part1-positions');
        part2ContainerElement = document.getElementById('part2-positions');
        partOneDescriptionElement = document.getElementById('partOneDescription');
        partTwoDescriptionElement = document.getElementById('partTwoDescription');

        return Boolean(
            deckContainer &&
            part1Grid &&
            part2Grid &&
            shuffleBtn &&
            deckTitleElement &&
            deckCardsContainer &&
            deckStatsElement &&
            remainingCountElement &&
            selectedCountElement &&
            spreadPositionsElement &&
            part1ContainerElement &&
            part2ContainerElement &&
            partOneDescriptionElement &&
            partTwoDescriptionElement
        );
    }

    function bindResultDomElements() {
        resultPart1Grid = document.getElementById('result-part1-grid');
        resultPart2Grid = document.getElementById('result-part2-grid');
        resultPartOneDescriptionElement = document.getElementById('result-partOneDescription');
        resultPartTwoDescriptionElement = document.getElementById('result-partTwoDescription');
        resultQuestionElement = document.getElementById('result-displayed-question');

        return Boolean(
            resultPart1Grid &&
            resultPart2Grid &&
            resultPartOneDescriptionElement &&
            resultPartTwoDescriptionElement &&
            resultQuestionElement
        );
    }

    function ensureResultDomElementsBound() {
        if (isResultDomBound) {
            return true;
        }

        const isBound = bindResultDomElements();

        if (isBound) {
            isResultDomBound = true;
        }

        return isBound;
    }   

    // ============================================
    // 8. UI HELPERS
    // ============================================

    function resetSelectPageDeckUi() {
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

    function scheduleDeckHeightAlignment(delay = 0) {
        const run = () => {
            requestAnimationFrame(() => alignDeckHeight());
        };

        if (delay > 0) {
            setTimeout(run, delay);
            return;
        }

        run();
    }

    // ============================================
    // 9. PART HELPERS
    // ============================================

    function getSelectPageGridByPart(part) {
        return part === 'part1' ? part1Grid : part2Grid;
    }

    function getSelectPagePartContainerByPart(part) {
        return part === 'part1' ? part1ContainerElement : part2ContainerElement;
    }

    function getSelectPageDescriptionElementByPart(part) {
        return part === 'part1' ? partOneDescriptionElement : partTwoDescriptionElement;
    }

    function getResultGridByPart(part) {
        return part === 'part1' ? resultPart1Grid : resultPart2Grid;
    }

    function getResultDescriptionElementByPart(part) {
        return part === 'part1'
            ? resultPartOneDescriptionElement
            : resultPartTwoDescriptionElement;
    }

    function setSelectPagePartDescription(part, text) {
        const descriptionElement = getSelectPageDescriptionElementByPart(part);

        if (!descriptionElement) {
            return;
        }

        descriptionElement.textContent = text;
    }

    function setResultPartDescription(part, text) {
        const descriptionElement = getResultDescriptionElementByPart(part);

        if (!descriptionElement) {
            return;
        }

        descriptionElement.textContent = text;
    }

    function setResultQuestion(question) {
        if (!resultQuestionElement) {
            return;
        }

        resultQuestionElement.textContent = question || '';
    }

    function showAllSelectPagePartContainers() {
        const part1Container = getSelectPagePartContainerByPart('part1');
        const part2Container = getSelectPagePartContainerByPart('part2');

        if (part1Container) {
            part1Container.style.display = 'block';
        }

        if (part2Container) {
            part2Container.style.display = 'block';
        }
    }

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

    function getPositionTitleByPart(part, index) {
        return part === 'part1'
            ? getPart1PositionTitle(index)
            : getPart2PositionTitle(index);
    }

    function getSpreadPartData(part) {
        if (typeof HEQET_SPREAD_DATA === 'undefined') {
            return null;
        }

        if (part === 'part1') {
            return HEQET_SPREAD_DATA.partOne || null;
        }

        if (part === 'part2') {
            return HEQET_SPREAD_DATA.partTwo || null;
        }

        return null;
    }

    function getPositionDescriptionByPart(part, positionIndex) {
        const spreadPartData = getSpreadPartData(part);

        if (
            spreadPartData &&
            Array.isArray(spreadPartData.positions) &&
            spreadPartData.positions[positionIndex]
        ) {
            return spreadPartData.positions[positionIndex];
        }

        return getPositionTitleByPart(part, positionIndex);
    }

    function applySelectPagePartDescriptions(logContext = '') {
        const suffix = logContext ? ` (${logContext})` : '';

        const part1Data = getSpreadPartData('part1');
        if (part1Data && typeof part1Data.description === 'string') {
            setSelectPagePartDescription('part1', part1Data.description);
            console.log(`✅ Добавлено описание первой части${suffix}`);
        }

        const part2Data = getSpreadPartData('part2');
        if (part2Data && typeof part2Data.description === 'string') {
            setSelectPagePartDescription('part2', part2Data.description);
            console.log(`✅ Добавлено описание второй части${suffix}`);
        }
    }

    function applyResultPartDescriptions() {
        const part1Data = getSpreadPartData('part1');
        if (part1Data && typeof part1Data.description === 'string') {
            setResultPartDescription('part1', part1Data.description);
        }

        const part2Data = getSpreadPartData('part2');
        if (part2Data && typeof part2Data.description === 'string') {
            setResultPartDescription('part2', part2Data.description);
        }
    }

    // ============================================
    // 10. PATH / AUDIO HELPERS
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
    // 11. STORAGE HELPERS
    // ============================================

    function hasValidSpreadData(spreadData) {
        return Boolean(
            spreadData &&
            Array.isArray(spreadData.part1) &&
            Array.isArray(spreadData.part2)
        );
    }

    function readSavedSpreadData() {
        const savedSpread = localStorage.getItem('tarot_last_complete_spread');

        if (!savedSpread) {
            return null;
        }

        try {
            const spreadData = JSON.parse(savedSpread);

            if (!hasValidSpreadData(spreadData)) {
                return null;
            }

            return spreadData;
        } catch (error) {
            console.warn('Ошибка чтения сохранённого расклада:', error);
            return null;
        }
    }

    function hydrateStoredCards(cards) {
        return cards.map((card) => ({
            ...card,
            isReversed: Boolean(card.isReversed),
            isSelected: true
        }));
    }

    function serializeCards(cards) {
        return cards.map((card) => ({
            id: card.id,
            name: card.name,
            upright: card.upright,
            reversed: card.reversed,
            isReversed: card.isReversed
        }));
    }

    // ============================================
    // 12. STATE HELPERS
    // ============================================

    function resetDeckState() {
        selectedCardsPart1 = [];
        selectedCardsPart2 = [];
        currentDeckCards = [];
        currentPart = 'part1';
        isShuffling = false;
        isSpreadStarted = false;
    }

    function initDecks() {
        majorDeck = tarotDeck
            .filter((card) => card.id >= 0 && card.id <= 21)
            .map((card) => ({
                ...card,
                isReversed: false,
                isSelected: false
            }));

        minorDeck = tarotDeck
            .filter((card) => card.id >= 22 && card.id <= 77)
            .map((card) => ({
                ...card,
                isReversed: false,
                isSelected: false
            }));

        console.log(`🃟 Колоды созданы: Старшие Арканы — ${majorDeck.length} карт, остальные — ${minorDeck.length} карт`);
    }

    // ============================================
    // 13. RENDER HELPERS
    // ============================================

    function createEmptySlot(title) {
        const div = document.createElement('div');
        div.className = 'empty-position';
        div.setAttribute('data-position', title);

        const p = document.createElement('p');
        p.textContent = title;

        div.appendChild(p);
        return div;
    }

    function createEmptyPositions() {
        ['part1', 'part2'].forEach((part) => {
            const grid = getSelectPageGridByPart(part);

            if (!grid) {
                return;
            }

            grid.innerHTML = '';

            for (let i = 0; i < 5; i++) {
                const emptySlot = createEmptySlot(getPositionTitleByPart(part, i));
                grid.appendChild(emptySlot);
            }
        });
    }

    function renderDeck(cards) {
        if (!deckCardsContainer) {
            return;
        }

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
        if (!remainingCountElement || !selectedCountElement) {
            return;
        }

        remainingCountElement.textContent = currentDeckCards.length;

        const selectedCount = currentPart === 'part1'
            ? selectedCardsPart1.length
            : selectedCardsPart2.length;

        selectedCountElement.textContent = `${selectedCount} / 5`;
    }

    function renderCardsToGrid(cards, grid, part) {
        if (!grid) {
            return;
        }

        grid.innerHTML = '';

        cards.forEach((card, index) => {
            const cardElement = createCardElementForSpread(card, part, index);
            grid.appendChild(cardElement);
        });
    }

    function createCardElementForSpread(card, part, positionIndex) {
        const positionDescription = getPositionDescriptionByPart(part, positionIndex);

        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-position';

        const topContainer = document.createElement('div');
        topContainer.className = 'card-position-top';
        const positionP = document.createElement('p');
        positionP.textContent = positionDescription;
        topContainer.appendChild(positionP);

        const middleContainer = document.createElement('div');
        middleContainer.className = 'card-position-middle';
        const img = document.createElement('img');
        img.src = getCardImagePath(card.id);
        img.alt = card.name;
        img.className = 'card-image';

        img.onerror = function() {
            console.warn(`Изображение для карты ${card.id} (${card.name}) не найдено`);
            this.src = getFallbackCardImagePath();
            this.alt = `Изображение отсутствует: ${card.name}`;
        };

        if (card.isReversed) {
            img.classList.add('reversed');
        }

        middleContainer.appendChild(img);

        const bottomContainer = document.createElement('div');
        bottomContainer.className = 'card-position-bottom';
        const descDiv = document.createElement('div');
        descDiv.className = 'card-description';

        const cardValue = card.isReversed ? card.reversed : card.upright;
        descDiv.textContent = `${card.name}: ${cardValue}`;

        bottomContainer.appendChild(descDiv);

        cardDiv.appendChild(topContainer);
        cardDiv.appendChild(middleContainer);
        cardDiv.appendChild(bottomContainer);

        return cardDiv;
    }

    // ============================================
    // 14. SELECT PAGE FLOW
    // ============================================

    function startNewSpread() {
        console.log('🃟 Создаём новый расклад...');

        resetDeckState();
        initDecks();
        createEmptyPositions();
        showAllSelectPagePartContainers();
        applySelectPagePartDescriptions();

        showPart1();

        isSpreadStarted = true;
        console.log('✅ Модуль колод инициализирован, можно начинать выбор');

        scheduleDeckHeightAlignment(100);
        return true;
    }

    function restoreSavedSpreadOnSelectPage(spreadData) {
        console.log('🔄 Восстанавливаем сохранённый расклад...');

        resetDeckState();

        selectedCardsPart1 = hydrateStoredCards(spreadData.part1);
        selectedCardsPart2 = hydrateStoredCards(spreadData.part2);

        renderCardsToGrid(selectedCardsPart1, part1Grid, 'part1');
        renderCardsToGrid(selectedCardsPart2, part2Grid, 'part2');
        showAllSelectPagePartContainers();
        applySelectPagePartDescriptions('при восстановлении');

        console.log('✅ Расклад восстановлен');

        scheduleDeckHeightAlignment(50);
        return true;
    }

    function cloneDeckCards(sourceDeck) {
        return sourceDeck.map((card) => ({
            ...card,
            isReversed: false,
            isSelected: false
        }));
    }

    function showDeckForPart(part, options) {
        const {
            sourceDeck,
            title,
            logMessage
        } = options;

        currentPart = part;
        currentDeckCards = cloneDeckCards(sourceDeck);

        shuffleDeck(true);

        if (deckTitleElement) {
            deckTitleElement.textContent = title;
        }

        updateStats();

        if (shuffleBtn) {
            shuffleBtn.disabled = false;
        }

        console.log(logMessage);
        scheduleDeckHeightAlignment(150);
    }


    function showPart1() {
        showDeckForPart('part1', {
            sourceDeck: majorDeck,
            title: '🃟 Старшие Арканы (22 карты)',
            logMessage: '🃟 Показана первая часть расклада, колода перетасована'
        });
    }

    function showPart2() {
        showDeckForPart('part2', {
            sourceDeck: minorDeck,
            title: '🃟 Остальные карты (56 карт)',
            logMessage: '🃟 Показана вторая часть расклада, колода перетасована'
        });

        console.log('🔓 Кнопка тасовки активирована для второй колоды');
    }

    function selectCard(index) {
        if (isShuffling) {
            return;
        }

        const card = currentDeckCards[index];
        if (!card || card.isSelected) {
            return;
        }

        const selectedCount = currentPart === 'part1'
            ? selectedCardsPart1.length
            : selectedCardsPart2.length;

        if (selectedCount >= 5) {
            return;
        }

        if (selectedCount === 0 && shuffleBtn) {
            shuffleBtn.disabled = true;
            console.log('🔒 Кнопка тасовки заблокирована (первая карта выбрана)');
        }

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
        scheduleDeckHeightAlignment();

        const newSelectedCount = currentPart === 'part1'
            ? selectedCardsPart1.length
            : selectedCardsPart2.length;

        if (newSelectedCount === 5) {
            onPartComplete();
        }
    }

    function addCardToPosition(card, positionIndex, part) {
        const grid = getSelectPageGridByPart(part);

        if (!grid) {
            return;
        }

        const cardElement = createCardElementForSpread(card, part, positionIndex);
        const children = grid.children;

        if (children[positionIndex]) {
            grid.replaceChild(cardElement, children[positionIndex]);
        }

        scheduleDeckHeightAlignment();
    }

    function onPartComplete() {
        if (currentPart === 'part1') {
            console.log('✅ Первая часть завершена! Переход ко второй части...');
            showPart2();
            scheduleDeckHeightAlignment(100);
            return;
        }

        console.log('✅ Весь расклад завершён!');
        onSpreadComplete();
    }

    function onSpreadComplete() {
        console.log('🎉 Расклад завершён! Переход на страницу результата...');

        saveCompleteSpread();

        if (typeof window.navigateToResultPage === 'function') {
            window.navigateToResultPage();
            return;
        }

        console.error('Ошибка: функция navigateToResultPage не найдена');
    }

    // ============================================
    // 15. RESULT PAGE FLOW
    // ============================================

    function renderResultSpread(spreadData) {
        setResultQuestion(spreadData.question);
        applyResultPartDescriptions();

        renderCardsToGrid(spreadData.part1, getResultGridByPart('part1'), 'part1');
        renderCardsToGrid(spreadData.part2, getResultGridByPart('part2'), 'part2');

        console.log(`✅ Восстановлено ${spreadData.part1.length} + ${spreadData.part2.length} карт`);
    }

    function restoreResultSpread() {
        const spreadData = readSavedSpreadData();

        if (!spreadData) {
            console.warn('⚠️ Нет сохранённого расклада');
            return false;
        }

        if (!ensureResultDomElementsBound()) {
            console.error('❌ Сетки для карт результата не найдены');
            return false;
        }

        try {
            console.log('🔄 Восстанавливаем расклад на странице результата...');
            renderResultSpread(spreadData);
            return true;
        } catch (error) {
            console.warn('Ошибка восстановления расклада:', error);
            return false;
        }
    }

    // ============================================
    // 16. СОХРАНЕНИЕ
    // ============================================

    function saveCompleteSpread() {
        const currentQuestion = localStorage.getItem('tarot_last_question') || '';

        const spreadData = {
            question: currentQuestion,
            timestamp: Date.now(),
            part1: serializeCards(selectedCardsPart1),
            part2: serializeCards(selectedCardsPart2)
        };

        localStorage.setItem('tarot_last_complete_spread', JSON.stringify(spreadData));
        localStorage.setItem('tarot_last_question', currentQuestion);

        console.log('💾 Расклад сохранён в localStorage');
    }

    // ============================================
    // 17. ТАСОВКА И ЗВУК
    // ============================================

    function initShuffleSound() {
        try {
            shuffleAudio = createShuffleAudio();
            shuffleAudio.load();
            console.log('🔊 Звук тасовки предзагружен');
        } catch (error) {
            console.warn('⚠️ Ошибка при загрузке звука:', error);
        }
    }

    function playShuffleSound() {
        if (shuffleAudio) {
            shuffleAudio.currentTime = 0;
            shuffleAudio.play().catch((error) => console.log('🔇', error));
            return;
        }

        const audio = createShuffleAudio();
        audio.play().catch((error) => console.log('🔇', error));
    }

    function shuffleDeck(isInitial = false) {
        if (isShuffling) {
            console.warn('Тасовка уже выполняется');
            return;
        }

        console.log('🃟 Тасуем колоду...');
        isShuffling = true;

        if (!isInitial && shuffleBtn) {
            shuffleBtn.disabled = true;
        }

        if (deckCardsContainer) {
            deckCardsContainer.classList.add('shuffling');
        }

        playShuffleSound();

        setTimeout(() => {
            currentDeckCards = currentDeckCards.map((card) => ({
                ...card,
                isReversed: Math.random() < 0.5
            }));

            for (let i = currentDeckCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentDeckCards[i], currentDeckCards[j]] = [currentDeckCards[j], currentDeckCards[i]];
            }

            renderDeck(currentDeckCards);

            if (deckCardsContainer) {
                deckCardsContainer.classList.remove('shuffling');
            }

            if (!isInitial && shuffleBtn) {
                shuffleBtn.disabled = false;
            }

            isShuffling = false;
            console.log('🃟 Колода перетасована');
        }, 3000);
    }

    // ============================================
    // 18. ВЫРАВНИВАНИЕ ВЫСОТЫ КОЛОДЫ
    // ============================================

    function alignDeckHeight() {
        if (!spreadPositionsElement || !deckContainer) {
            return;
        }

        const positionsHeight = spreadPositionsElement.offsetHeight;
        deckContainer.style.height = `${positionsHeight}px`;

        if (!deckCardsContainer) {
            return;
        }

        let otherHeight = 0;

        if (deckTitleElement) {
            otherHeight += deckTitleElement.offsetHeight;
        }

        if (deckStatsElement) {
            otherHeight += deckStatsElement.offsetHeight;
        }

        if (shuffleBtn) {
            otherHeight += shuffleBtn.offsetHeight;
        }

        otherHeight += 95;

        const cardsMaxHeight = positionsHeight - otherHeight;
        deckCardsContainer.style.maxHeight = `${Math.max(cardsMaxHeight, 200)}px`;
        deckCardsContainer.style.overflowY = 'auto';

        console.log(`📐 Высота колоды: ${positionsHeight}px`);
        console.log(`📐 Высота контейнера карт: ${deckCardsContainer.style.maxHeight}`);
        console.log(`📐 Высота других элементов: ${otherHeight}px`);
    }

    // ============================================
    // 19. ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
    // ============================================

    function initDeckModule() {
        console.log('🃟 Инициализация модуля колод');

        if (!bindSelectPageDomElements()) {
            console.error('Ошибка: не найдены элементы для колод');
            return false;
        }

        resetSelectPageDeckUi();

        if (!shuffleAudio) {
            initShuffleSound();
        }

        const spreadData = readSavedSpreadData();
        if (spreadData) {
            console.log('✅ Модуль колод: найден сохранённый расклад');
            return restoreSavedSpreadOnSelectPage(spreadData);
        }

        return startNewSpread();
    }

    // ============================================
    // 20. СБРОС МОДУЛЯ
    // ============================================

    function resetDeckModule() {
        console.log('🃟 Сброс состояния колод...');

        resetDeckState();

        if (part1Grid) {
            part1Grid.innerHTML = '';
        }

        if (part2Grid) {
            part2Grid.innerHTML = '';
        }

        resetSelectPageDeckUi();

        isResultDomBound = false;
        
        console.log('✅ Состояние колод сброшено');
    }

    // ============================================
    // 21. ПУБЛИЧНЫЙ API
    // ============================================

    window.initializeDeckSelectionPage = initDeckModule;
    window.resetDeckSelectionState = resetDeckModule;
    window.alignDeckLayoutHeight = alignDeckHeight;
    window.restoreSpreadOnResultPage = restoreResultSpread;
})();