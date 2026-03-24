// ============================================
// 1. КОНФИГУРАЦИЯ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================

let isProcessing = false;          // Флаг для блокировки повторных нажатий
let currentStep = 1;               // Текущий шаг приветствия (не используется в новой версии, оставлен для совместимости)
const totalSteps = 3;              // Всего шагов приветствия (для совместимости)


// ============================================
// 2. УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

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


// ============================================
// 3. КОМПОНЕНТЫ
// ============================================

/**
 * Создаёт DOM-элемент карточки для одной карты
 * @param {Object} card - объект карты с полями id, name, upright, reversed, isReversed
 * @param {string} positionDescription - текст описания позиции в раскладе
 * @returns {HTMLElement} - элемент карточки
 */
function createCardElement(card, positionDescription) {
    // 1. Создаём главный контейнер карточки
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-position';

    // 2. Верхний мини-контейнер: описание позиции в раскладе
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

    // Обработчик ошибки загрузки изображения
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
 * Отображает массив карт в указанном контейнере
 * @param {Array} cardsArray - массив объектов карт
 * @param {Array} positionsArray - массив описаний позиций (должен совпадать по длине)
 * @param {HTMLElement} containerElement - DOM-элемент, куда добавлять карты
 */
function displayCards(cardsArray, positionsArray, containerElement) {
    // Проверяем, что массивы одинаковой длины
    if (cardsArray.length !== positionsArray.length) {
        console.error('Ошибка: массивы карт и позиций имеют разную длину');
        return;
    }

    // Очищаем контейнер перед отображением новых карт
    containerElement.innerHTML = '';

    // Создаём и добавляем элементы карточек
    for (let i = 0; i < cardsArray.length; i++) {
        const card = cardsArray[i];
        const positionText = positionsArray[i];
        const cardElement = createCardElement(card, positionText);
        containerElement.appendChild(cardElement);
    }
}


// ============================================
// 4. НАВИГАЦИЯ МЕЖДУ СТРАНИЦАМИ
// ============================================

// Список страниц с их идентификаторами, текстами кнопок и иконками
const pages = [
    {
        id: 'page-welcome',
        buttonText: '«Таро Гранд Эттейла»',
        buttonIcon: '✨',
        buttonId: 'nav-to-welcome'
    },
    {
        id: 'page-history',
        buttonText: 'История «Таро Гранд Эттейла»',
        buttonIcon: '📜',
        buttonId: 'nav-to-history'
    },
    {
        id: 'page-rules',
        buttonText: 'Правила расклада «Прыжок Хекет»',
        buttonIcon: '🐸',
        buttonId: 'nav-to-rules'
    },
    {
        id: 'page-spread',
        buttonText: 'Получить расклад «Прыжок Хекет»',
        buttonIcon: '🔮',
        buttonId: 'nav-to-spread'
    }
];

/**
 * Создаёт кнопки навигации и добавляет их в DOM
 * Кнопка текущей страницы не отображается
 */
function createNavButtons() {
    const navContainer = document.getElementById('nav-buttons');
    if (!navContainer) {
        console.error('Ошибка: контейнер nav-buttons не найден');
        return;
    }
    
    navContainer.innerHTML = '';
    const activePageId = getActivePageId();
    
    pages.forEach(page => {
        if (page.id !== activePageId) {
            const button = document.createElement('button');
            button.className = 'nav-btn';
            button.id = page.buttonId;
            button.onclick = () => switchToPage(page.id);
            button.innerHTML = `${page.buttonIcon} ${page.buttonText}`;
            navContainer.appendChild(button);
        }
    });
}

/**
 * Переключает на указанную страницу
 * @param {string} pageId - ID страницы (например, 'page-welcome')
 */
function switchToPage(pageId) {
    // Скрываем все страницы
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => page.classList.remove('active-page'));
    
    // Показываем нужную страницу
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active-page');
    
    // Если перешли на страницу расклада — загружаем карты
    if (pageId === 'page-spread') loadSpread();
    
    // Обновляем навигационные кнопки
    createNavButtons();
    
    // Прокручиваем страницу вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ============================================
// 5. ЛОГИКА РАСКЛАДА
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


// ============================================
// 6. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ============================================

// Ожидаем полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    
    // === Заполнение страницы приветствия ===
    const welcomeContent = document.getElementById('welcome-content');
    if (welcomeContent && typeof INTRO_TEXT !== 'undefined') {
        welcomeContent.innerHTML = INTRO_TEXT.replace(/\n/g, '<br>');
    }
    
    // === Заполнение страницы истории ===
    const historyContent = document.getElementById('history-content');
    if (historyContent && typeof HISTORY_TEXT !== 'undefined') {
        historyContent.innerHTML = HISTORY_TEXT.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
    
    // === Заполнение страницы правил расклада ===
    const rulesContent = document.getElementById('rules-content');
    if (rulesContent && typeof HEQET_TEXT !== 'undefined') {
        rulesContent.innerHTML = HEQET_TEXT.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
    
    // === Создание навигации ===
    createNavButtons();
    
    // === Обработчик кнопки нового расклада ===
    const newSpreadBtn = document.getElementById('new-spread-btn');
    if (newSpreadBtn) {
        newSpreadBtn.addEventListener('click', () => {
            console.log('🔄 Генерируем новый расклад');
            loadSpread();
        });
    }
    
    console.log('✅ Приложение инициализировано');
});


// ============================================
// 7. ДАННЫЕ (tarotDeck)
// ============================================

const tarotDeck = [
    { id: 0, name: "0. Безумие или Алхимик", upright: "Экстравагантность. Творчество. Беззаботность, беспечность.", reversed: "Опрометчивость, неосторожность. Иллюзия, мечта, заблуждение. Трещина, раскол во взаимоотношениях в обществе." },
    { id: 1, name: "1. Хаос", upright: "Лояльность. Дипломатия. Искренность, прямота. Широта замысла, натуры.", reversed: "Судьба, рок. Инициатива. Дух предпринимательства." },
    { id: 2, name: "2. Свет", upright: "Солидарность. Дружба. Разъяснение.", reversed: "Раздражительность, обидчивость. Неясность. Лицемерие." },
    { id: 3, name: "3. Растения и птицы", upright: "Желание перемен. Экскурсии. Особые встречи.", reversed: "Нескромность, болтливость, разглашение тайны. Кража. Вирус." },
    { id: 4, name: "4. Небо", upright: "Усталость. Недомогание. Неприятные неожиданности.", reversed: "Внезапная гениальная мысль. Разоблачение. Удар молнии, разрушение от удара молнии." },
    { id: 5, name: "5. Человек", upright: "Благоприятный момент. Вознаграждение. Выигрыш. Путешествие.", reversed: "Трудности. Несовершенство. Неприязнь, враждебность." },
    { id: 6, name: "6. Звёзды", upright: "Новые интересы. Отличная идея. Исправление, улучшение.", reversed: "Неблагоприятный момент. Утрата ясности понимания. Страх." },
    { id: 7, name: "7. Птицы и рыбы", upright: "Защита. Поддержка. Судебный приговор.", reversed: "Примирение. Эффективная помощь." },
    { id: 8, name: "8. Покой", upright: "Интуиция. Платоническая любовь. Сдержанность, такт, скромность.", reversed: "Попытки, испытания. Засады. Эгоизм. Предрассудки, предубеждения." },
    { id: 9, name: "9. Правосудие", upright: "Внутренняя уравновешенность. Вновь обретённый мир логики.", reversed: "Пристрастие. Некорректность. Судебная ловушка." },
    { id: 10, name: "10. Сдержанность", upright: "Замедление, сдерживание. Простота. Приспособляемость, согласование. Выздоровление.", reversed: "Эксцессы. Антипатия. Утомлённость." },
    { id: 11, name: "11. Сила", upright: "Мужество. Настойчивость. Работа. Нравственность.", reversed: "Чрезмерная бдительность, надёжность, уверенность. Импульсивность. Сильный враг." },
    { id: 12, name: "12. Осторожность", upright: "Тишина. Одиночные поиски. Осмотрительность.", reversed: "Неоправданное доверие. Чрезмерные благотворительность, альтруизм." },
    { id: 13, name: "13. Брак", upright: "Клятва. Договор. Союз. Важное решение.", reversed: "Крушение. Волокита. Измена." },
    { id: 14, name: "14. Высшая сила", upright: "Инстинктивность. Увлечение. Колдовство.", reversed: "Аморальность, безнравственность. Душевная неуравновешенность, невыдержанность. Извращённость." },
    { id: 15, name: "15. Маг", upright: "Любовь к риску. Азартная игра, лотерея. Опасные дружеские связи.", reversed: "Тщеславие, кокетство. Шарлатанство. Разоблаченное мошенничество." },
    { id: 16, name: "16. Суд", upright: "Известность, слава, знаменитость. Выздоровление. Благоприятный приговор.", reversed: "Поражение. Несправедливость. Раскаяние. Упрёк, осуждение." },
    { id: 17, name: "17. Смерть", upright: "Радикальное изменение. Конец круговорота.", reversed: "Остановка, перебои, застой, затишье, заминка. Бесчувствие. Тяжёлое заболевание." },
    { id: 18, name: "18. Отшельник", upright: "Важность. Размышление. Подготовка. Опыт.", reversed: "Предательство. Одиночество, уединение. Бесполезные действия." },
    { id: 19, name: "19. Храм", upright: "Потеря товаров. Несчастный случай. Крах убеждений.", reversed: "Наказание. Изгнание. Провал, крах. Бедствие, нищета." },
    { id: 20, name: "20. Колесо", upright: "Преходящие достоинства. Хорошие возможности. Нерегулярные встречи.", reversed: "Нестабильность. Периодические болезни." },
    { id: 21, name: "21. Африканский деспот", upright: "Деспотический авторитет. Неизменная позиция, точка зрения.", reversed: "Амбиции. Руководящие способности, независимость." },
    { id: 22, name: "22. Король", upright: "Солидный и уважаемый мужчина указывает на решение.", reversed: "Властный и одновременно щедрый предприниматель." },
    { id: 23, name: "23. Королева", upright: "Исполненная добродетели и понимания мать или супруга.", reversed: "Дружба с искренней и сердечной женщиной." },
    { id: 24, name: "24. Рыцарь", upright: "Известие от родственника или от друга издалека.", reversed: "Проблемы с родственником из-за кого-либо." },
    { id: 25, name: "25. Кавалер", upright: "Молодой человек, мужчина или женщина, ищет работу.", reversed: "Соперник в любовных делах или конкурент на рабочем месте." },
    { id: 26, name: "26. Десятка", upright: "Нечестный знакомый. Тайный заговор в семье или на рабочем месте.", reversed: "Затруднения на работе или во время путешествия." },
    { id: 27, name: "27. Девятка", upright: "Незначительные проблемы из-за происшествия.", reversed: "Несчастный случай, приводящий в затруднительное положение. Физические трудности." },
    { id: 28, name: "28. Восьмёрка", upright: "Садоводство. Прогулка с родственниками или друзьями.", reversed: "Раскаяние. Мучительные, неприятные воспоминания. Жалость, плен." },
    { id: 29, name: "29. Семёрка", upright: "Обмен идеями. Ценная встреча.", reversed: "Бесполезная болтовня. Сомнения. Неопределённость, неуверенность." },
    { id: 30, name: "30. Шестёрка", upright: "Спор из-за семейных дел.", reversed: "Работа, затянувшаяся дольше запланированного срока. Пропавшее письмо." },
    { id: 31, name: "31. Пятёрка", upright: "Доходы в результате тяжелого труда. Развлечения с друзьями.", reversed: "Длительное развитие. Опасность разочарования." },
    { id: 32, name: "32. Четвёрка", upright: "Доходное объединение. Выгодное соглашение.", reversed: "Собрание членов семьи. Возможная беременность." },
    { id: 33, name: "33. Тройка", upright: "Смелый план. Необходимые усилия.", reversed: "Близкое окончание проблем. Маленькая награда." },
    { id: 34, name: "34. Двойка", upright: "Грусть в связи с отъездом или отсутствием кого-либо.", reversed: "Необычное событие. Изумление." },
    { id: 35, name: "35. Туз", upright: "Изобретение, открытие. Созидание. Появление чего-то особого.", reversed: "Обратный ход дел. Отклонение инициатив." },
    { id: 36, name: "36. Король", upright: "Знающий мужчина даёт указания и хорошие советы.", reversed: "Конфликт с сильным, неискренним мужчиной." },
    { id: 37, name: "37. Королева", upright: "Любимая женщина или супруга, от души оказывающая свою помощь.", reversed: "Испорченная женщина создаёт проблемы." },
    { id: 38, name: "38. Рыцарь", upright: "Молодой друг передаёт подарки или благоприятные предложения.", reversed: "Неблагонадёжный коммерсант. Авантюрист." },
    { id: 39, name: "39. Кавалер", upright: "Молодой сотрудник предлагает свежие идеи.", reversed: "Невозмужавший молодой и недостойный доверия человек." },
    { id: 40, name: "40. Десятка", upright: "Успех, но вдали от места рождения.", reversed: "Неприятности в семье. Возможный случай смерти." },
    { id: 41, name: "41. Девятка", upright: "Деловой подъём. Счастье в любви.", reversed: "Доверчивость в отношениях с лживыми, двуличными персонами. Легкомыслие, необдуманность." },
    { id: 42, name: "42. Восьмёрка", upright: "Длительная дружба с добродетельной женщиной.", reversed: "Ощущение счастья благодаря давно ожидавшемуся свершению." },
    { id: 43, name: "43. Семёрка", upright: "Решение проблемы. Создание модной модели.", reversed: "Планы, связанные с развлечениями или со свадьбой." },
    { id: 44, name: "44. Шестёрка", upright: "Приятные и полезные воспоминания. Анализ прошлого.", reversed: "Сегодняшнюю радость заглушают пережитые страдания." },
    { id: 45, name: "45. Пятёрка", upright: "Наследство. Приданое. Подлежащее сохранению имущество.", reversed: "Семейные торжества. Важное решение." },
    { id: 46, name: "46. Четвёрка", upright: "Скучные, надоедливые взаимоотношения. Регулярные обсуждения.", reversed: "Подозрительная надёжность. Обоснованные опасения." },
    { id: 47, name: "47. Тройка", upright: "Облегчение. Хороший выход. Выздоровление.", reversed: "Сделка с непредвиденным исходом." },
    { id: 48, name: "48. Двойка", upright: "Любовь. Большая симпатия. Сильное увлечение, страсть.", reversed: "Неисполненные желания. Ревность." },
    { id: 49, name: "49. Туз", upright: "Светский приём. Застольные удовольствия.", reversed: "Изменение позиции, точки зрения." },
    { id: 50, name: "50. Король", upright: "Опытный эксперт оказывает ценные консультации.", reversed: "Изворотливая, жестокая личность." },
    { id: 51, name: "51. Королева", upright: "Одинокая женщина с тяжёлым характером создаёт проблемы.", reversed: "Плетущая интриги либо просто злонамеренная женщина." },
    { id: 52, name: "52. Рыцарь", upright: "Наёмник. Боевой, воинствующий сотрудник.", reversed: "Невежественный либо неблагоразумный сотрудник." },
    { id: 53, name: "53. Кавалер", upright: "Шпион. Молодой исследователь. Детектив.", reversed: "Услужливый, но некомпетентный помощник." },
    { id: 54, name: "54. Десятка", upright: "Слезы или даже рыдания из-за материальных проблем.", reversed: "Возвращение счастья." },
    { id: 55, name: "55. Девятка", upright: "Безбрачие. Временное одиночество. Робость, нерешительность.", reversed: "Недоверие, подозрение. Сомнения всякого рода." },
    { id: 56, name: "56. Восьмёрка", upright: "Конструктивная критика. Исправление ошибок.", reversed: "Неприятное происшествие. Значительные, но проходящие неприятности." },
    { id: 57, name: "57. Семёрка", upright: "Ожидание важных известий или изменений.", reversed: "Консультация эксперта." },
    { id: 58, name: "58. Шестёрка", upright: "Профессиональная карьера. Временный перевод на другую службу.", reversed: "Исповедь. Объяснение. Протест." },
    { id: 59, name: "59. Пятёрка", upright: "Сокращающиеся доходы. Передача, уступка имущества. Распад.", reversed: "Потеря всех надежд." },
    { id: 60, name: "60. Четвёрка", upright: "Одиночество, обусловленное различными превратностями судьбы.", reversed: "Экономия применительно к грядущим выплатам." },
    { id: 61, name: "61. Тройка", upright: "Даль. Несовместимость характеров. Расторжение, расставание.", reversed: "Несчастная любовь. Тёмные дела." },
    { id: 62, name: "62. Двойка", upright: "Гармония в семье и на работе. Ответные любезности.", reversed: "Лживые якобы дружеские отношения." },
    { id: 63, name: "63. Туз", upright: "Неприязнь, враждебность. Чрезмерное сопротивление. Нервозность.", reversed: "Плодотворные усилия. Возможная беременность." },
    { id: 64, name: "64. Король", upright: "Предприниматель, имеющий добрые намерения в отношении консультирующегося. Внимательный инвестор.", reversed: "Пожилой и развратный, безнравственный, испорченный, греховный мужчина." },
    { id: 65, name: "65. Королева", upright: "Занимающая высокое положение приятельница просит о финансовой поддержке.", reversed: "Враждебно настроенная женщина, у которой нет моральных принципов и отсутствует добродетель." },
    { id: 66, name: "66. Рыцарь", upright: "Консультант по вопросам финансов и недвижимости помогает получать доходы.", reversed: "Ленивый или безработный мужчина." },
    { id: 67, name: "67. Кавалер", upright: "Хороший школьник или ученик (на производстве, в торговле и т.п.), старается получить хорошие результаты своего обучения.", reversed: "Безалаберный, неряшливый, беспутный, развратный молодой человек." },
    { id: 68, name: "68. Десятка", upright: "Квартира, стоимость которой возрастает.", reversed: "Мгновенно использованная, удачная возможность." },
    { id: 69, name: "69. Девятка", upright: "Воплощение в жизнь задуманного, но без достижения полного удовлетворения.", reversed: "Наличие проблем с платежами." },
    { id: 70, name: "70. Восьмерка", upright: "Встреча с одной нежной девушкой. Любезности.", reversed: "Взаимоотношения с сомнительными, не внушающими доверия личностями." },
    { id: 71, name: "71. Семёрка", upright: "Получение назад одолженных или инвестированных денег.", reversed: "Заботы о проекте, реализация которого началась именно сейчас." },
    { id: 72, name: "72. Шестёрка", upright: "Очень запутанная ситуация.", reversed: "Дорогостоящий, разорительный проект. Растаявшие иллюзии." },
    { id: 73, name: "73. Пятёрка", upright: "Кризис общественных или любовных взаимоотношений.", reversed: "Финансовые затруднения. Любовное страдание." },
    { id: 74, name: "74. Четвёрка", upright: "Небольшой подарок. Ответ на оказанную любезность.", reversed: "Ограничение подвижности. Закрытая обстановка, среда." },
    { id: 75, name: "75. Тройка", upright: "Поддержка, оказываемая одной известной личностью.", reversed: "Чрезвычайное положение, крайняя необходимость, нужда. Неспособность добиться того, чтобы тебя правильно понимали." },
    { id: 76, name: "76. Двойка", upright: "Все дороги перекрыты. Слабоволие в борьбе с неприятностями.", reversed: "Нехорошие новости, плохие известия." },
    { id: 77, name: "77. Туз", upright: "Большая радость, разделяемая с другими. Результаты более хорошие, чем ожидалось.", reversed: "Деньги, выигранные либо полученные в качестве подарка." }
];