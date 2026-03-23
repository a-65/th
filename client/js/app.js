// ============================================
// ЗАЩИТА ОТ ДВОЙНОГО НАЖАТИЯ
// ============================================

let isProcessing = false; // Флаг, блокирующий повторные нажатия

function withLock(callback) {
    return function(...args) {
        if (isProcessing) return; // Если уже обрабатывается — игнорируем
        isProcessing = true;
        try {
            callback.apply(this, args);
        } finally {
            setTimeout(() => { isProcessing = false; }, 500); // Разблокируем через 0.5 сек
        }
    };
}

// Оборачиваем функции, которые могут вызываться многократно
const originalNextStep = window.nextStep;
window.nextStep = withLock(originalNextStep);

const originalStartApp = window.startApp;
window.startApp = withLock(originalStartApp);

const originalShowHeqtLeapSpread = window.showHeqtLeapSpread;
window.showHeqtLeapSpread = withLock(originalShowHeqtLeapSpread);

const originalBackToMainMenu = window.backToMainMenu;
window.backToMainMenu = withLock(originalBackToMainMenu);


// Проверяем, что данные из data.js загрузились
console.log('Проверка данных:');
console.log('PART_ONE_POSITIONS есть?', typeof PART_ONE_POSITIONS !== 'undefined');
if (typeof PART_ONE_POSITIONS !== 'undefined') {
    console.log('Первая позиция:', PART_ONE_POSITIONS[0]);
} else {
    console.error('ОШИБКА: PART_ONE_POSITIONS не определена!');
}

/**
 * Получает массив уникальных карт из указанного диапазона
 * @param {number} count - сколько карт нужно получить
 * @param {number} minId - минимальный ID карты (включительно)
 * @param {number} maxId - максимальный ID карты (включительно)
 * @returns {Array} - массив объектов карт
 */
function getUniqueCardsFromRange(count, minId, maxId) {
    let selectedCards = [];
    let attempts = 0;
    const maxAttempts = 1000; // защита от бесконечного цикла
    
    while (selectedCards.length < count && attempts < maxAttempts) {
        // Генерируем случайный ID в заданном диапазоне
        let randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
        
        // Находим карту с таким ID в глобальном массиве tarotDeck
        let card = tarotDeck.find(c => c.id === randomId);
        
        if (card) {
            // Создаём копию карты и добавляем флаг перевёрнутости
            let cardCopy = { ...card };
            const isReversed = Math.random() < 0.5;
            cardCopy.isReversed = isReversed;

            // Добавляем пометку к названию, если карта перевёрнутая (как в getRandomCard)
            if (isReversed) {
                cardCopy.name += " (перевёрнутая)";
            }
            
            // Проверяем, нет ли уже такой карты (сравниваем по id)
            let isDuplicate = selectedCards.some(c => c.id === cardCopy.id);
            
            if (!isDuplicate) {
                selectedCards.push(cardCopy);
            }
        }
        
        attempts++;
    }
    
    if (attempts >= maxAttempts) {
        console.warn('Достигнуто максимальное количество попыток при выборе карт');
    }
    
    return selectedCards;
}

function showHeqtLeapSpread() {
    // 1. Находим все нужные элементы
    const mainContent = document.getElementById('main-content');
    const heqtContainer = document.getElementById('heqt-leap-container');
    const partOneCards = document.getElementById('partOneCards');
    const partTwoCards = document.getElementById('partTwoCards');
    const partOneDescription = document.getElementById('partOneDescription');
    const partTwoDescription = document.getElementById('partTwoDescription');

    // Проверяем, что нашли все элементы
    console.log('Найден main-content:', mainContent);
    console.log('Найден heqt-leap-container:', heqtContainer);
    console.log('Найден partOneCards:', partOneCards);
    console.log('Найден partTwoCards:', partTwoCards);
    console.log('Найден partOneDescription:', partOneDescription);
    console.log('Найден partTwoDescription:', partTwoDescription);

    // 2. Проверяем, что все элементы найдены
    if (!mainContent || !heqtContainer || !partOneCards || !partTwoCards || 
        !partOneDescription || !partTwoDescription) {
        console.error('Ошибка: не найдены элементы для расклада');
        return;
    }

    // 3. Очищаем старые карты (если есть)
    partOneCards.innerHTML = '';
    partTwoCards.innerHTML = '';
    console.log('✅ Старые карты очищены');

    // 4. Добавляем описания частей из data.js


    // Проверяем, что PART_ONE_DESCRIPTION и PART_TWO_DESCRIPTION определены и не пустые, прежде чем добавлять их в DOM. Если они не определены или пустые, выводим предупреждение в консоль и устанавливаем текст по умолчанию.
    if (typeof PART_ONE_DESCRIPTION !== 'undefined' && PART_ONE_DESCRIPTION && PART_ONE_DESCRIPTION.trim() !== '') {
        partOneDescription.innerHTML = PART_ONE_DESCRIPTION;
        console.log('✅ Описание первой части добавлено');
    } else {
        console.warn('Предупреждение: PART_ONE_DESCRIPTION не определён или пустой. Устанавливаю текст по умолчанию.');
        partOneDescription.innerHTML = 'Описание первой части недоступно.';
    }

    if (typeof PART_TWO_DESCRIPTION !== 'undefined' && PART_TWO_DESCRIPTION && PART_TWO_DESCRIPTION.trim() !== '') {
        partTwoDescription.innerHTML = PART_TWO_DESCRIPTION;
        console.log('✅ Описание второй части добавлено');
    } else {
        console.warn('Предупреждение: PART_TWO_DESCRIPTION не определён или пустой. Устанавливаю текст по умолчанию.');
        partTwoDescription.innerHTML = 'Описание второй части недоступно.';
    }

    // 5. Получаем карты для обеих частей
    console.log('🎴 Получаем карты для расклада...');

    const firstPartCards = getUniqueCardsFromRange(5, 0, 21);   // Старшие Арканы
    const secondPartCards = getUniqueCardsFromRange(5, 22, 77); // Остальные

    // Проверяем, что получили нужное количество карт
    if (firstPartCards.length !== 5) {
        console.error(`Ошибка: для первой части получено ${firstPartCards.length} карт вместо 5`);
        alert('Ошибка при выборе карт для первой части. Пожалуйста, попробуйте снова.');
        return;
    }

      if (secondPartCards.length !== 5) {
        console.error(`Ошибка: для второй части получено ${secondPartCards.length} карт вместо 5`);
        alert('Ошибка при выборе карт для второй части. Пожалуйста, попробуйте снова.');
        return;
    }

    console.log('✅ Первая часть (ситуация) — 5 карт:');
    console.log(firstPartCards);

    console.log('✅ Вторая часть (вопрошающий) — 5 карт:');
    console.log(secondPartCards);

    // Выводим ID карт для проверки
    console.log('ID первой части:', firstPartCards.map(c => c.id));
    console.log('Уникальны?', new Set(firstPartCards.map(c => c.id)).size === 5);

    console.log('ID второй части:', secondPartCards.map(c => c.id));
    console.log('Уникальны?', new Set(secondPartCards.map(c => c.id)).size === 5);

    // 6. Переключаем видимость
    mainContent.style.display = 'none';
    heqtContainer.style.display = 'block';
    console.log('👁‍🗨 Главное меню скрыто, расклад показан');

    // 7. Прокручиваем страницу вверх для удобства
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    console.log('📜 Страница прокручена вверх');

    // 8. Отображаем карты первой части
    console.log('🎨 Отображаем первую часть расклада...');

    // Проверяем, что PART_ONE_POSITIONS определён и имеет 5 описаний
    let partOnePositionsToUse;
    if (typeof PART_ONE_POSITIONS !== 'undefined' && Array.isArray(PART_ONE_POSITIONS) && PART_ONE_POSITIONS.length === 5) {
        partOnePositionsToUse = PART_ONE_POSITIONS;
    } else {
        console.warn('Предупреждение: PART_ONE_POSITIONS не определён или имеет неправильную длину. Устанавливаю текст по умолчанию.');
        partOnePositionsToUse = ['🔹 Позиция 1', '🔹 Позиция 2', '🔹 Позиция 3', '🔹 Позиция 4', '🔹 Позиция 5'];
    }
    displayCards(firstPartCards, partOnePositionsToUse, partOneCards);

    // 9. Отображаем карты второй части
    console.log('🎨 Отображаем вторую часть расклада...');

    let partTwoPositionsToUse;
    if (typeof PART_TWO_POSITIONS !== 'undefined' && Array.isArray(PART_TWO_POSITIONS) && PART_TWO_POSITIONS.length === 5) {
        partTwoPositionsToUse = PART_TWO_POSITIONS;
    } else {
        console.warn('Предупреждение: PART_TWO_POSITIONS не определён или имеет неправильную длину. Устанавливаю текст по умолчанию.');
        partTwoPositionsToUse = ['🔹 Позиция 1', '🔹 Позиция 2', '🔹 Позиция 3', '🔹 Позиция 4', '🔹 Позиция 5'];
    }
    displayCards(secondPartCards, partTwoPositionsToUse, partTwoCards);

}

// Функция возврата в главное меню
function backToMainMenu() {
    console.log('🔙 Возвращаемся в главное меню');
    
    // Находим элементы
    const mainContent = document.getElementById('main-content');
    const heqtContainer = document.getElementById('heqt-leap-container');

    // Проверяем, что нашли все элементы
    console.log('Найден main-content:', mainContent);
    console.log('Найден heqt-leap-container:', heqtContainer);
    
    // Проверяем, что элементы найдены
    if (!mainContent || !heqtContainer) {
        console.error('Ошибка: не найдены элементы для возврата');
        return;
    }
    
    // Переключаем видимость обратно
    mainContent.style.display = 'block';
    heqtContainer.style.display = 'none';
    
    console.log('✅ Вернулись в главное меню');
    
    // Прокручиваем страницу вверх
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Создаёт элемент карточки для одной карты
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

  // Добавляем обработчик ошибки загрузки изображения
  img.onerror = function() {
    console.warn(`Изображение для карты ${card.id} (${card.name}) не найдено`);
    this.src = '../images/book_thoth.jpg'; // путь к картинке-заглушке
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

  // 5. Собираем карточку вместе (добавляем три контейнера по порядку)
  cardDiv.appendChild(topContainer);
  cardDiv.appendChild(middleContainer);
  cardDiv.appendChild(bottomContainer);

  console.log('✅ Карточка создана:', card.name);
  
  return cardDiv;
}

// Отображает карты в указанном контейнере
function displayCards(cardsArray, positionsArray, containerElement) {
  console.log(`📋 Отображаем ${cardsArray.length} карт`);

  // Проверяем, что массивы одинаковой длины
  if (cardsArray.length !== positionsArray.length) {
    console.error('Ошибка: массивы карт и позиций имеют разную длину');
    return;
  }

  // Очищаем контейнер перед отображением новых карт
  containerElement.innerHTML = '';

  // Создаем и добавляем элементы карточек
  for (let i = 0; i < cardsArray.length; i++) {
    const card = cardsArray[i];
    const positionText = positionsArray[i];

    // Создаём элемент карточки
    const cardElement = createCardElement(card, positionText);

    // Добавляем карточку в контейнер
    containerElement.appendChild(cardElement);
    
    console.log(`✅ Карта "${card.name}" отображена в позиции "${positionText}"`);
  }

  console.log('✅ Все карты отображены успешно');
}

// ============================================
// ЭКРАН ПРИВЕТСТВИЯ (ПОШАГОВЫЙ)
// ============================================

let currentStep = 1;          // Текущий шаг (1, 2 или 3)
const totalSteps = 3;         // Всего шагов в приветствии

/**
 * Обновляет внешний вид прогресс-бара
 * Подсвечивает пройденные шаги
 */
function updateProgressBar() {
    const steps = document.querySelectorAll('.progress-step');  // Находим все кружочки с цифрами
    steps.forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');    // Добавляем класс active для пройденных шагов
        } else {
            step.classList.remove('active'); // Убираем класс active для будущих шагов
        }
    });
}

/**
 * Переход к следующему шагу приветствия
 * Вызывается при нажатии на кнопку "Далее →" или "Правила расклада →"
 */
function nextStep() {
    // 1. Находим текущий активный шаг и скрываем его
    const currentStepElement = document.getElementById(`step-${getStepId(currentStep)}`);
    if (currentStepElement) {
        currentStepElement.classList.remove('active');
    }
    
    // 2. Увеличиваем номер текущего шага
    currentStep++;
    
    // 3. Если шаг существует — показываем его
    if (currentStep <= totalSteps) {
        const nextStepElement = document.getElementById(`step-${getStepId(currentStep)}`);
        if (nextStepElement) {
            nextStepElement.classList.add('active');
            updateProgressBar();               // Обновляем прогресс-бар
            
            // Плавно прокручиваем страницу вверх (удобно для пользователя)
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

/**
 * Возвращает строковый идентификатор шага по его номеру
 * @param {number} step - номер шага (1, 2 или 3)
 * @returns {string} - идентификатор ('intro', 'history' или 'rules')
 */
function getStepId(step) {
    const steps = {
        1: 'intro',   // Шаг 1 — приветствие
        2: 'history', // Шаг 2 — история колоды
        3: 'rules'    // Шаг 3 — правила расклада
    };
    return steps[step];
}

/**
 * Завершает приветствие и запускает основное приложение
 * Вызывается при нажатии на кнопку "✨ К гаданию ✨"
 */
function startApp() {
    // 1. Находим элементы экрана приветствия и главного меню
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainContent = document.getElementById('main-content');
    
    // 2. Скрываем приветствие, показываем главное меню
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
    
    // 3. Сбрасываем прогресс для следующего возможного запуска (опционально)
    currentStep = 1;
    updateProgressBar();
    
    // 4. Плавно прокручиваем страницу вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// ЗАПОЛНЕНИЕ КОНТЕНТА СТРАНИЦ
// ============================================

// Ожидаем полной загрузки DOM перед выполнением скрипта
// Это гарантирует, что все элементы страницы уже существуют в момент обращения к ним
document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // СТРАНИЦА ПРИВЕТСТВИЯ
    // ============================================
    
    // Заполняем страницу приветствия (INTRO_TEXT)
    // INTRO_TEXT — это строка с вступительным текстом о колоде Таро
    const welcomeContent = document.getElementById('welcome-content');
    if (welcomeContent && typeof INTRO_TEXT !== 'undefined') {
        // replace(/\n/g, '<br>') — заменяет все переносы строк в тексте на HTML-теги <br>
        // Это нужно для корректного отображения многострочного текста в HTML
        welcomeContent.innerHTML = INTRO_TEXT.replace(/\n/g, '<br>');
    }
    
    // ============================================
    // СТРАНИЦА ИСТОРИИ КОЛОДЫ
    // ============================================
    
    // Заполняем страницу истории (HISTORY_TEXT — массив строк)
    // HISTORY_TEXT содержит массив строк с историческими сведениями о колоде
    const historyContent = document.getElementById('history-content');
    if (historyContent && typeof HISTORY_TEXT !== 'undefined') {
        // map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`) — оборачивает каждый элемент массива в тег <p>
        // join('') — объединяет все элементы в одну строку без разделителей
        historyContent.innerHTML = HISTORY_TEXT.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
    
    // ============================================
    // СТРАНИЦА ПРАВИЛ РАСКЛАДА
    // ============================================
    
    // Заполняем страницу правил расклада (HEQET_TEXT — массив строк)
    // HEQET_TEXT содержит массив строк с описанием расклада «Прыжок Хекет»
    const rulesContent = document.getElementById('rules-content');
    if (rulesContent && typeof HEQET_TEXT !== 'undefined') {
        // Аналогично истории: каждый элемент массива оборачивается в <p>, переносы строк заменяются на <br>
        rulesContent.innerHTML = HEQET_TEXT.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
    
    // Выводим в консоль подтверждение успешного заполнения страниц
    console.log('✅ Страницы заполнены контентом');

    // Создаём кнопки навигации
    createNavButtons();
    
    // Добавляем обработчик для кнопки нового расклада
    const newSpreadBtn = document.getElementById('new-spread-btn');
    if (newSpreadBtn) {
        newSpreadBtn.addEventListener('click', () => {
            console.log('🔄 Генерируем новый расклад');
            loadSpread();  // Просто перезагружаем расклад
        });
    }
    
    console.log('✅ Все страницы готовы');
});

// ============================================
// СТРАНИЦА РАСКЛАДА
// ============================================

/**
 * Загружает расклад на страницу spread
 */
function loadSpread() {
    console.log('🎴 Загружаем расклад "Прыжок Хекет"');
    
    // Находим контейнеры для карт
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
    
    // Получаем карты для обеих частей
    const firstPartCards = getUniqueCardsFromRange(5, 0, 21);   // Старшие Арканы
    const secondPartCards = getUniqueCardsFromRange(5, 22, 77); // Остальные
    
    // Проверяем, что получили нужное количество карт
    if (firstPartCards.length !== 5 || secondPartCards.length !== 5) {
        console.error('Ошибка: не удалось получить 5 карт для каждой части');
        return;
    }
    
    // Получаем описания позиций
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
    
    console.log('✅ Расклад загружен');
}

function switchToPage(pageId) {
    // 1. Скрываем все страницы
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active-page');
    });
    
    // 2. Показываем нужную страницу
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active-page');
    }
    
    // 3. Если перешли на страницу расклада — загружаем карты
    if (pageId === 'page-spread') {
        loadSpread();
    }
    
    // 4. Обновляем навигационные кнопки
    createNavButtons();
    
    // 5. Прокручиваем страницу вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log(`📄 Перешли на страницу: ${pageId}`);
}


const pages = [
    {
        id: 'page-welcome',
        buttonText: '✨ «Таро Гранд Эттейла»',
        buttonId: 'nav-to-welcome'
    },
    {
        id: 'page-history',
        buttonText: '📜 История «Таро Гранд Эттейла»',
        buttonId: 'nav-to-history'
    },
    {
        id: 'page-rules',
        buttonText: '🐸 Правила расклада «Прыжок Хекет»',
        buttonId: 'nav-to-rules'
    },
    {
        id: 'page-spread',                                    // Новая страница
        buttonText: '🔮 Получить расклад «Прыжок Хекет»',       // Текст кнопки
        buttonId: 'nav-to-spread'                             // ID кнопки
    }
];


/**
 * Создаёт кнопки навигации и добавляет их в DOM
 */
function createNavButtons() {
    const navContainer = document.getElementById('nav-buttons');
    if (!navContainer) {
        console.error('Ошибка: контейнер nav-buttons не найден');
        return;
    }
    
    // Очищаем контейнер (на случай повторного вызова)
    navContainer.innerHTML = '';
    
    // Получаем ID текущей активной страницы
    const activePageId = getActivePageId();
    
    // Для каждой страницы создаём кнопку, если это не текущая страница
    pages.forEach(page => {
        if (page.id !== activePageId) {
            const button = document.createElement('button');
            button.textContent = page.buttonText;
            button.className = 'nav-btn';
            button.id = page.buttonId;
            button.onclick = () => switchToPage(page.id);
            navContainer.appendChild(button);
        }
    });
    
    console.log('✅ Навигационные кнопки созданы, активная страница:', activePageId);
}

/**
 * Возвращает ID текущей активной страницы
 */
function getActivePageId() {
    const activePage = document.querySelector('.page.active-page');
    return activePage ? activePage.id : 'page-welcome';
}



// Массив объектов Карт таро
const tarotDeck = [
  {
    id: 0,
    name: "0. Безумие или Алхимик",
    upright: "Экстравагантность. Творчество. Беззаботность, беспечность.",
    reversed: "Опрометчивость, неосторожность. Иллюзия, мечта, заблуждение. Трещина, раскол во взаимоотношениях в обществе."
  },
  {
    id: 1,
    name: "1. Хаос",
    upright: "Лояльность. Дипломатия. Искренность, прямота. Широта замысла, натуры.",
    reversed: "Судьба, рок. Инициатива. Дух предпринимательства."
  },
  {
    id: 2,
    name: "2. Свет",
    upright: "Солидарность. Дружба. Разъяснение.",
    reversed: "Раздражительность, обидчивость. Неясность. Лицемерие."
  },
  {
    id: 3,
    name: "3. Растения и птицы",
    upright: "Желание перемен. Экскурсии. Особые встречи.",
    reversed: "Нескромность, болтливость, разглашение тайны. Кража. Вирус."
  },
  {
    id: 4,
    name: "4. Небо",
    upright: "Усталость. Недомогание. Неприятные неожиданности.",
    reversed: "Внезапная гениальная мысль. Разоблачение. Удар молнии, разрушение от удара молнии."
  },
  {
    id: 5,
    name: "5. Человек",
    upright: "Благоприятный момент. Вознаграждение. Выигрыш. Путешествие.",
    reversed: "Трудности. Несовершенство. Неприязнь, враждебность."
  },
  {
    id: 6,
    name: "6. Звёзды",
    upright: "Новые интересы. Отличная идея. Исправление, улучшение.",
    reversed: "Неблагоприятный момент. Утрата ясности понимания. Страх."
  },
  {
    id: 7,
    name: "7. Птицы и рыбы",
    upright: "Защита. Поддержка. Судебный приговор.",
    reversed: "Примирение. Эффективная помощь."
  },
  {
    id: 8,
    name: "8. Покой",
    upright: "Интуиция. Платоническая любовь. Сдержанность, такт, скромность.",
    reversed: "Попытки, испытания. Засады. Эгоизм. Предрассудки, предубеждения."
  },
  {
    id: 9,
    name: "9. Правосудие",
    upright: "Внутренняя уравновешенность. Вновь обретённый мир логики.",
    reversed: "Пристрастие. Некорректность. Судебная ловушка."
  },
  {
    id: 10,
    name: "10. Сдержанность",
    upright: "Замедление, сдерживание. Простота. Приспособляемость, согласование. Выздоровление.",
    reversed: "Эксцессы. Антипатия. Утомлённость."
  },
  {
    id: 11,
    name: "11. Сила",
    upright: "Мужество. Настойчивость. Работа. Нравственность.",
    reversed: "Чрезмерная бдительность, надёжность, уверенность. Импульсивность. Сильный враг."
  },
  {
    id: 12,
    name: "12. Осторожность",
    upright: "Тишина. Одиночные поиски. Осмотрительность.",
    reversed: "Неоправданное доверие. Чрезмерные благотворительность, альтруизм."
  },
  {
    id: 13,
    name: "13. Брак",
    upright: "Клятва. Договор. Союз. Важное решение.",
    reversed: "Крушение. Волокита. Измена."
  },
  {
    id: 14,
    name: "14. Высшая сила",
    upright: "Инстинктивность. Увлечение. Колдовство.",
    reversed: "Аморальность, безнравственность. Душевная неуравновешенность, невыдержанность. Извращённость."
  },
  {
    id: 15,
    name: "15. Маг",
    upright: "Любовь к риску. Азартная игра, лотерея. Опасные дружеские связи.",
    reversed: "Тщеславие, кокетство. Шарлатанство. Разоблаченное мошенничество."
  },
  {
    id: 16,
    name: "16. Суд",
    upright: "Известность, слава, знаменитость. Выздоровление. Благоприятный приговор.",
    reversed: "Поражение. Несправедливость. Раскаяние. Упрёк, осуждение."
  },
  {
    id: 17,
    name: "17. Смерть",
    upright: "Радикальное изменение. Конец круговорота.",
    reversed: "Остановка, перебои, застой, затишье, заминка. Бесчувствие. Тяжёлое заболевание."
  },
  {
    id: 18,
    name: "18. Отшельник",
    upright: "Важность. Размышление. Подготовка. Опыт.",
    reversed: "Предательство. Одиночество, уединение. Бесполезные действия."
  },
  {
    id: 19,
    name: "19. Храм",
    upright: "Потеря товаров. Несчастный случай. Крах убеждений.",
    reversed: "Наказание. Изгнание. Провал, крах. Бедствие, нищета."
  },
  {
    id: 20,
    name: "20. Колесо",
    upright: "Преходящие достоинства. Хорошие возможности. Нерегулярные встречи.",
    reversed: "Нестабильность. Периодические болезни."
  },
  {
    id: 21,
    name: "21. Африканский деспот",
    upright: "Деспотический авторитет. Неизменная позиция, точка зрения.",
    reversed: "Амбиции. Руководящие способности, независимость."
  },
  {
    id: 22,
    name: "22. Король",
    upright: "Солидный и уважаемый мужчина указывает на решение.",
    reversed: "Властный и одновременно щедрый предприниматель."
  },
  {
    id: 23,
    name: "23. Королева",
    upright: "Исполненная добродетели и понимания мать или супруга.",
    reversed: "Дружба с искренней и сердечной женщиной."
  },
  {
    id: 24,
    name: "24. Рыцарь",
    upright: "Известие от родственника или от друга издалека.",
    reversed: "Проблемы с родственником из-за кого-либо."
  },
  {
    id: 25,
    name: "25. Кавалер",
    upright: "Молодой человек, мужчина или женщина, ищет работу.",
    reversed: "Соперник в любовных делах или конкурент на рабочем месте."
  },
  {
    id: 26,
    name: "26. Десятка",
    upright: "Нечестный знакомый. Тайный заговор в семье или на рабочем месте.",
    reversed: "Затруднения на работе или во время путешествия."
  },
  {
    id: 27,
    name: "27. Девятка",
    upright: "Незначительные проблемы из-за происшествия.",
    reversed: "Несчастный случай, приводящий в затруднительное положение. Физические трудности."
  },
  {
    id: 28,
    name: "28. Восьмёрка",
    upright: "Садоводство. Прогулка с родственниками или друзьями.",
    reversed: "Раскаяние. Мучительные, неприятные воспоминания. Жалость, плен."
  },
  {
    id: 29,
    name: "29. Семёрка",
    upright: "Обмен идеями. Ценная встреча.",
    reversed: "Бесполезная болтовня. Сомнения. Неопределённость, неуверенность."
  },
  {
    id: 30,
    name: "30. Шестёрка",
    upright: "Спор из-за семейных дел.",
    reversed: "Работа, затянувшаяся дольше запланированного срока. Пропавшее письмо."
  },
  {
    id: 31,
    name: "31. Пятёрка",
    upright: "Доходы в результате тяжелого труда. Развлечения с друзьями.",
    reversed: "Длительное развитие. Опасность разочарования."
  },
  {
    id: 32,
    name: "32. Четвёрка",
    upright: "Доходное объединение. Выгодное соглашение.",
    reversed: "Собрание членов семьи. Возможная беременность."
  },
  {
    id: 33,
    name: "33. Тройка",
    upright: "Смелый план. Необходимые усилия.",
    reversed: "Близкое окончание проблем. Маленькая награда."
  },
  {
    id: 34,
    name: "34. Двойка",
    upright: "Грусть в связи с отъездом или отсутствием кого-либо.",
    reversed: "Необычное событие. Изумление."
  },
  {
    id: 35,
    name: "35. Туз",
    upright: "Изобретение, открытие. Созидание. Появление чего-то особого.",
    reversed: "Обратный ход дел. Отклонение инициатив."
  },
  {
    id: 36,
    name: "36. Король",
    upright: "Знающий мужчина даёт указания и хорошие советы.",
    reversed: "Конфликт с сильным, неискренним мужчиной."
  },
  {
    id: 37,
    name: "37. Королева",
    upright: "Любимая женщина или супруга, от души оказывающая свою помощь.",
    reversed: "Испорченная женщина создаёт проблемы."
  },
  {
    id: 38,
    name: "38. Рыцарь",
    upright: "Молодой друг передаёт подарки или благоприятные предложения.",
    reversed: "Неблагонадёжный коммерсант. Авантюрист."
  },
  {
    id: 39,
    name: "39. Кавалер",
    upright: "Молодой сотрудник предлагает свежие идеи.",
    reversed: "Невозмужавший молодой и недостойный доверия человек."
  },
  {
    id: 40,
    name: "40. Десятка",
    upright: "Успех, но вдали от места рождения.",
    reversed: "Неприятности в семье. Возможный случай смерти."
  },
  {
    id: 41,
    name: "41. Девятка",
    upright: "Деловой подъём. Счастье в любви.",
    reversed: "Доверчивость в отношениях с лживыми, двуличными персонами. Легкомыслие, необдуманность."
  },
  {
    id: 42,
    name: "42. Восьмёрка",
    upright: "Длительная дружба с добродетельной женщиной.",
    reversed: "Ощущение счастья благодаря давно ожидавшемуся свершению."
  },
  {
    id: 43,
    name: "43. Семёрка",
    upright: "Решение проблемы. Создание модной модели.",
    reversed: "Планы, связанные с развлечениями или со свадьбой."
  },
  {
    id: 44,
    name: "44. Шестёрка",
    upright: "Приятные и полезные воспоминания. Анализ прошлого.",
    reversed: "Сегодняшнюю радость заглушают пережитые страдания."
  },
  {
    id: 45,
    name: "45. Пятёрка",
    upright: "Наследство. Приданое. Подлежащее сохранению имущество.",
    reversed: "Семейные торжества. Важное решение."
  },
  {
    id: 46,
    name: "46. Четвёрка",
    upright: "Скучные, надоедливые взаимоотношения. Регулярные обсуждения.",
    reversed: "Подозрительная надёжность. Обоснованные опасения."
  },
  {
    id: 47,
    name: "47. Тройка",
    upright: "Облегчение. Хороший выход. Выздоровление.",
    reversed: "Сделка с непредвиденным исходом."
  },
  {
    id: 48,
    name: "48. Двойка",
    upright: "Любовь. Большая симпатия. Сильное увлечение, страсть.",
    reversed: "Неисполненные желания. Ревность."
  },
  {
    id: 49,
    name: "49. Туз",
    upright: "Светский приём. Застольные удовольствия.",
    reversed: "Изменение позиции, точки зрения."
  },
  {
    id: 50,
    name: "50. Король",
    upright: "Опытный эксперт оказывает ценные консультации.",
    reversed: "Изворотливая, жестокая личность."
  },
  {
    id: 51,
    name: "51. Королева",
    upright: "Одинокая женщина с тяжёлым характером создаёт проблемы.",
    reversed: "Плетущая интриги либо просто злонамеренная женщина."
  },
  {
    id: 52,
    name: "52. Рыцарь",
    upright: "Наёмник. Боевой, воинствующий сотрудник.",
    reversed: "Невежественный либо неблагоразумный сотрудник."
  },
  {
    id: 53,
    name: "53. Кавалер",
    upright: "Шпион. Молодой исследователь. Детектив.",
    reversed: "Услужливый, но некомпетентный помощник."
  },
  {
    id: 54,
    name: "54. Десятка",
    upright: "Слезы или даже рыдания из-за материальных проблем.",
    reversed: "Возвращение счастья."
  },
  {
    id: 55,
    name: "55. Девятка",
    upright: "Безбрачие. Временное одиночество. Робость, нерешительность.",
    reversed: "Недоверие, подозрение. Сомнения всякого рода."
  },
  {
    id: 56,
    name: "56. Восьмёрка",
    upright: "Конструктивная критика. Исправление ошибок.",
    reversed: "Неприятное происшествие. Значительные, но проходящие неприятности."
  },
  {
    id: 57,
    name: "57. Семёрка",
    upright: "Ожидание важных известий или изменений.",
    reversed: "Консультация эксперта."
  },
  {
    id: 58,
    name: "58. Шестёрка",
    upright: "Профессиональная карьера. Временный перевод на другую службу.",
    reversed: "Исповедь. Объяснение. Протест."
  },
  {
    id: 59,
    name: "59. Пятёрка",
    upright: "Сокращающиеся доходы. Передача, уступка имущества. Распад.",
    reversed: "Потеря всех надежд."
  },
  {
    id: 60,
    name: "60. Четвёрка",
    upright: "Одиночество, обусловленное различными превратностями судьбы.",
    reversed: "Экономия применительно к грядущим выплатам."
  },
  {
    id: 61,
    name: "61. Тройка",
    upright: "Даль. Несовместимость характеров. Расторжение, расставание.",
    reversed: "Несчастная любовь. Тёмные дела."
  },
  {
    id: 62,
    name: "62. Двойка",
    upright: "Гармония в семье и на работе. Ответные любезности.",
    reversed: "Лживые якобы дружеские отношения."
  },
  {
    id: 63,
    name: "63. Туз",
    upright: "Неприязнь, враждебность. Чрезмерное сопротивление. Нервозность.",
    reversed: "Плодотворные усилия. Возможная беременность."
  },
  {
    id: 64,
    name: "64. Король",
    upright: "Предприниматель, имеющий добрые намерения в отношении консультирующегося. Внимательный инвестор.",
    reversed: "Пожилой и развратный, безнравственный, испорченный, греховный мужчина."
  },
  {
    id: 65,
    name: "65. Королева",
    upright: "Занимающая высокое положение приятельница просит о финансовой поддержке.",
    reversed: "Враждебно настроенная женщина, у которой нет моральных принципов и отсутствует добродетель."
  },
  {
    id: 66,
    name: "66. Рыцарь",
    upright: "Консультант по вопросам финансов и недвижимости помогает получать доходы.",
    reversed: "Ленивый или безработный мужчина."
  },
  {
    id: 67,
    name: "67. Кавалер",
    upright: "Хороший школьник или ученик (на производстве, в торговле и т.п.), старается получить хорошие результаты своего обучения.",
    reversed: "Безалаберный, неряшливый, беспутный, развратный молодой человек."
  },
  {
    id: 68,
    name: "68. Десятка",
    upright: "Квартира, стоимость которой возрастает.",
    reversed: "Мгновенно использованная, удачная возможность."
  },
  {
    id: 69,
    name: "69. Девятка",
    upright: "Воплощение в жизнь задуманного, но без достижения полного удовлетворения.",
    reversed: "Наличие проблем с платежами."
  },
  {
    id: 70,
    name: "70. Восьмерка",
    upright: "Встреча с одной нежной девушкой. Любезности.",
    reversed: "Взаимоотношения с сомнительными, не внушающими доверия личностями."
  },
  {
    id: 71,
    name: "71. Семёрка",
    upright: "Получение назад одолженных или инвестированных денег.",
    reversed: "Заботы о проекте, реализация которого началась именно сейчас."
  },
  {
    id: 72,
    name: "72. Шестёрка",
    upright: "Очень запутанная ситуация.",
    reversed: "Дорогостоящий, разорительный проект. Растаявшие иллюзии."
  },
  {
    id: 73,
    name: "73. Пятёрка",
    upright: "Кризис общественных или любовных взаимоотношений.",
    reversed: "Финансовые затруднения. Любовное страдание."
  },
  {
    id: 74,
    name: "74. Четвёрка",
    upright: "Небольшой подарок. Ответ на оказанную любезность.",
    reversed: "Ограничение подвижности. Закрытая обстановка, среда."
  },
  {
    id: 75,
    name: "75. Тройка",
    upright: "Поддержка, оказываемая одной известной личностью.",
    reversed: "Чрезвычайное положение, крайняя необходимость, нужда. Неспособность добиться того, чтобы тебя правильно понимали."
  },
  {
    id: 76,
    name: "76. Двойка",
    upright: "Все дороги перекрыты. Слабоволие в борьбе с неприятностями.",
    reversed: "Нехорошие новости, плохие известия."
  },
  {
    id: 77,
    name: "77. Туз",
    upright: "Большая радость, разделяемая с другими. Результаты более хорошие, чем ожидалось.",
    reversed: "Деньги, выигранные либо полученные в качестве подарка."
  }
];