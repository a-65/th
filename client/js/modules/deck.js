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

    // --------------------------------------------
    // 5. ФЛАГИ СОСТОЯНИЯ
    // --------------------------------------------
    let isShuffling = false;              // Блокировка во время тасовки
    let isSpreadStarted = false;          // Начат ли выбор карт

    // ============================================
    // 6. ПРИВЯЗКА К DOM И СБРОС UI
    // ============================================

    /**
     * Находит все нужные DOM-элементы колоды и сохраняет их в переменные.
     * Вызывается один раз при входе на страницу выбора карт.
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

        return Boolean(
            deckContainer &&
            part1Grid &&
            part2Grid &&
            deckTitleElement &&
            deckCardsContainer &&
            shuffleBtn &&
            remainingCountElement &&
            selectedCountElement
        );
    }

    /**
     * Сбрасывает визуальное состояние колоды к начальному.
     * Не изменяет данные расклада (карты, текущую часть).
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
    // 7. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПУТЕЙ
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
    // 8. ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
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

        // Пытаемся восстановить сохранённый расклад
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

        const part1Container = document.getElementById('part1-positions');
        const part2Container = document.getElementById('part2-positions');
        if (part1Container) part1Container.style.display = 'block';
        if (part2Container) part2Container.style.display = 'block';

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

        showPart1();

        isSpreadStarted = true;
        console.log('✅ Модуль колод инициализирован, можно начинать выбор');

        setTimeout(() => {
            requestAnimationFrame(() => alignDeckHeight());
        }, 100);

        return true;
    }

    // ============================================
    // 9. РАБОТА С КОЛОДАМИ
    // ============================================

    function initDecks() {
        majorDeck = tarotDeck
            .filter(card => card.id >= 0 && card.id <= 21)
            .map(card => ({
                ...card,
                isReversed: false,
                isSelected: false
            }));

        minorDeck = tarotDeck
            .filter(card => card.id >= 22 && card.id <= 77)
            .map(card => ({
                ...card,
                isReversed: false,
                isSelected: false
            }));

        console.log(`🃟 Колоды созданы: Старшие Арканы — ${majorDeck.length} карт, остальные — ${minorDeck.length} карт`);
    }

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

    // ============================================
    // 10. РЕНДЕР И СТАТИСТИКА
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
    // 11. ПОКАЗ ЧАСТЕЙ РАСКЛАДА
    // ============================================

    function showPart1() {
        currentPart = 'part1';

        currentDeckCards = majorDeck.map(card => ({
            ...card,
            isReversed: false,
            isSelected: false
        }));

        shuffleDeck(true);

        if (deckTitleElement) {
            deckTitleElement.textContent = '🃟 Старшие Арканы (22 карты)';
        }

        console.log('🃟 Показана первая часть расклада, колода перетасована');

        setTimeout(() => {
            requestAnimationFrame(() => alignDeckHeight());
        }, 150);
    }

    function showPart2() {
        currentPart = 'part2';

        currentDeckCards = minorDeck.map(card => ({
            ...card,
            isReversed: false,
            isSelected: false
        }));

        shuffleDeck(true);

        if (deckTitleElement) {
            deckTitleElement.textContent = '🃟 Остальные карты (56 карт)';
        }

        updateStats();

        if (shuffleBtn) {
            shuffleBtn.disabled = false;
            console.log('🔓 Кнопка тасовки активирована для второй колоды');
        }

        isShuffling = false;

        console.log('🃟 Показана вторая часть расклада, колода перетасована');

        setTimeout(() => {
            requestAnimationFrame(() => alignDeckHeight());
        }, 150);
    }

    // ============================================
    // 12. ТАСОВКА
    // ============================================

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
            currentDeckCards = currentDeckCards.map(card => ({
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
    // 13. ЗВУКОВЫЕ ЭФФЕКТЫ
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
            try {
                shuffleAudio.currentTime = 0;
                shuffleAudio.play().catch(error => {
                    console.log('🔇 Воспроизведение звука заблокировано:', error);
                });
                console.log('🔊 Звук тасовки воспроизведён');
            } catch (error) {
                console.warn('⚠️ Ошибка при воспроизведении звука:', error);
            }
        } else {
            const audio = createShuffleAudio();
            audio.play().catch(e => console.log('🔇', e));
        }
    }

    // ============================================
    // 14. ВЫБОР КАРТ И ДОБАВЛЕНИЕ В ПОЗИЦИИ
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

        const selectedCount = currentPart === 'part1'
            ? selectedCardsPart1.length
            : selectedCardsPart2.length;

        if (selectedCount >= 5) {
            console.warn('Уже выбрано 5 карт для этой части');
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

        requestAnimationFrame(() => {
            alignDeckHeight();
        });

        const newSelectedCount = currentPart === 'part1'
            ? selectedCardsPart1.length
            : selectedCardsPart2.length;

        if (newSelectedCount === 5) {
            onPartComplete();
        }
    }

    function addCardToPosition(card, positionIndex, part) {
        const gridId = part === 'part1' ? 'select-part1-grid' : 'select-part2-grid';
        const grid = document.getElementById(gridId);
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
    // 15. СОЗДАНИЕ ЭЛЕМЕНТА КАРТЫ
    // ============================================

    function createCardElementForSpread(card, part, positionIndex) {
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
    // 16. ЗАВЕРШЕНИЕ ЧАСТЕЙ РАСКЛАДА
    // ============================================

    function onPartComplete() {
        if (currentPart === 'part1') {
            console.log('✅ Первая часть завершена! Переход ко второй части...');
            showPart2();
            setTimeout(() => {
                requestAnimationFrame(() => alignDeckHeight());
            }, 100);
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

    // ============================================
    // 17. ВОССТАНОВЛЕНИЕ РАСКЛАДА
    // ============================================

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

    function restoreCardsToPositions(cards, part) {
        const gridId = part === 'part1' ? 'select-part1-grid' : 'select-part2-grid';
        const grid = document.getElementById(gridId);
        if (!grid) return;

        grid.innerHTML = '';

        cards.forEach((card, index) => {
            const cardElement = createCardElementForSpread(card, part, index);
            grid.appendChild(cardElement);
        });

        setTimeout(() => {
            requestAnimationFrame(() => alignDeckHeight());
        }, 50);
    }

    // ============================================
    // 18. ВЫРАВНИВАНИЕ ВЫСОТЫ КОЛОДЫ
    // ============================================

    function alignDeckHeight() {
        if (!deckContainer) return;

        const spreadPositions = document.querySelector('.spread-positions');
        if (!spreadPositions) return;

        const positionsHeight = spreadPositions.offsetHeight;
        deckContainer.style.height = positionsHeight + 'px';

        if (deckCardsContainer) {
            let otherHeight = 0;
            if (deckTitleElement) {
                otherHeight += deckTitleElement.offsetHeight;
            }

            const statsEl = deckContainer.querySelector('.deck-stats');
            const shuffleEl = deckContainer.querySelector('.shuffle-btn');
            if (statsEl) otherHeight += statsEl.offsetHeight;
            if (shuffleEl) otherHeight += shuffleEl.offsetHeight;

            otherHeight += 95; // отступы и запас

            const cardsMaxHeight = positionsHeight - otherHeight;
            deckCardsContainer.style.maxHeight = Math.max(cardsMaxHeight, 200) + 'px';
            deckCardsContainer.style.overflowY = 'auto';

            console.log(`📐 Высота колоды: ${positionsHeight}px`);
            console.log(`📐 Высота контейнера карт: ${deckCardsContainer.style.maxHeight}`);
            console.log(`📐 Высота других элементов: ${otherHeight}px`);
        }
    }

    // ============================================
    // 19. ВОССТАНОВЛЕНИЕ НА СТРАНИЦЕ РЕЗУЛЬТАТА
    // ============================================

    function restoreResultSpread() {
        const savedSpread = localStorage.getItem('tarot_last_complete_spread');
        if (!savedSpread) {
            console.warn('⚠️ Нет сохранённого расклада');
            return false;
        }

        try {
            const spreadData = JSON.parse(savedSpread);
            if (!spreadData.part1 || !spreadData.part2) return false;

            console.log('🔄 Восстанавливаем расклад на странице результата...');

            const resultPart1Grid = document.getElementById('result-part1-grid');
            const resultPart2Grid = document.getElementById('result-part2-grid');
            const partOneDesc = document.getElementById('result-partOneDescription');
            const partTwoDesc = document.getElementById('result-partTwoDescription');
            const questionSpan = document.getElementById('result-displayed-question');

            if (!resultPart1Grid || !resultPart2Grid) {
                console.error('❌ Сетки для карт не найдены');
                return false;
            }

            if (questionSpan && spreadData.question) {
                questionSpan.textContent = spreadData.question;
                console.log('📝 Вопрос восстановлен:', spreadData.question);
            }

            if (partOneDesc && typeof PART_ONE_DESCRIPTION !== 'undefined') {
                partOneDesc.textContent = PART_ONE_DESCRIPTION;
            }
            if (partTwoDesc && typeof PART_TWO_DESCRIPTION !== 'undefined') {
                partTwoDesc.textContent = PART_TWO_DESCRIPTION;
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
    // 20. СБРОС МОДУЛЯ
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
    // 21. ЭКСПОРТ ПУБЛИЧНОГО API
    // ============================================

    window.initDeckModule = initDeckModule;
    window.resetDeckModule = resetDeckModule;
    window.alignDeckHeight = alignDeckHeight;
    window.restoreResultSpread = restoreResultSpread;

})();