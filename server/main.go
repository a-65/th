package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/jackc/pgx/v5"
)

type Card struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Symbol      string `json:"symbol"`
	Description string `json:"description"`
}

// Глобальная переменная для подключения к БД
var db *pgx.Conn

func main() {
	// 1. Подключение к базе данных
	connectDB()
	defer db.Close(context.Background())

	// 2. Проверяем, что таблица с картами существует и заполнена
	ensureCardsInDB()

	// 3. Настраиваем обработчики
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	http.HandleFunc("/api/card", cardHandler)
	http.HandleFunc("/api/deck", deckHandler)

	// 4. Запускаем сервер
	server := &http.Server{Addr: ":8080"}

	// 5. Graceful shutdown (красивое завершение)
	go func() {
		fmt.Println("🔮 Архивариус запущен на http://localhost:8080")
		fmt.Println("👉 http://localhost:8080 - твой интерфейс")
		fmt.Println("👉 http://localhost:8080/api/card - случайная карта (JSON)")
		fmt.Println("👉 http://localhost:8080/api/deck - вся колода (JSON)")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Ошибка запуска: %v", err)
		}
	}()

	// 6. Ждем сигнала завершения (Ctrl + C)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	fmt.Println("\n🔮 Архивариус завершает заботу...")
	server.Shutdown(context.Background())
}

// connectDB устанавливаем соудинение с PostgreSQL
func connectDB() {
	connString := "postgres://tarot_user:tarot_password@localhost:5432/tarotdb?sslmode=disable"

	var err error
	db, err = pgx.Connect(context.Background(), connString)
	if err != nil {
		log.Fatalf("Не удалось подключиться к базе: %v", err)
	}

	fmt.Println("✅ Подключение к базу данных установлено")
}

// ensureCardsInDB проверяет, есть ли карты, и если нет - добавляет
func ensureCardsInDB() {
	var count int
	err := db.QueryRow(context.Background(), "SELECT COUNT(*) FROM cards WHERE deleted_at IS NULL").Scan(&count)
	if err != nil {
		log.Fatalf("Ошибка при проверке карт: %v", err)
	}

	if count == 0 {
		fmt.Println("📦 База данных пуста. Загружаю стартовую колоду...")
		seedCards()
	} else {
		fmt.Printf("📦 В базе данных %d активных карт\n", count)
	}
}

// seedCards заполняет базу начальными картами
func seedCards() {
	cards := []Card{
		{Name: "Маг", Symbol: "🪄", Description: "Сила воли, мастерство, концентрация"},
		{Name: "Верховная Жрица", Symbol: "🌙", Description: "Интуиция, тайна, внутренний голос"},
		{Name: "Императрица", Symbol: "🌹", Description: "Изобилие, природа, материнство"},
		{Name: "Император", Symbol: "👑", Description: "Власть, структура, авторитет, стабильность"},
		{Name: "Иерофант", Symbol: "⛪", Description: "Традиции, духовное руководство, вера, обучение"},
		{Name: "Влюбленные", Symbol: "💞", Description: "Любовь, выбор, отношения, гармония"},
		{Name: "Колесница", Symbol: "🏆", Description: "Воля, решимость, победа, контроль над противоречиями"},
		{Name: "Сила", Symbol: "🦁", Description: "Внутренняя сила, мужество, сострадание, терпение"},
		{Name: "Отшельник", Symbol: "🏮", Description: "Мудрость, поиск истины, уединение, самоанализ"},
		{Name: "Колесо Фортуны", Symbol: "🎡", Description: "Судьба, перемены, удача, поворотный момент"},
		{Name: "Справедливость", Symbol: "⚖️", Description: "Правда, честность, равновесие, карма"},
		{Name: "Повешенный", Symbol: "🔄", Description: "Новый взгляд, жертва, пауза, просветление"},
		{Name: "Смерть", Symbol: "💀", Description: "Трансформация, завершение, новое начало"},
		{Name: "Умеренность", Symbol: "⚗️", Description: "Баланс, гармония, терпение, умеренность"},
		{Name: "Дьявол", Symbol: "😈", Description: "Зависимость, ограничения, материализм, темная сторона"},
		{Name: "Башня", Symbol: "🏛️", Description: "Разрушение, внезапные перемены, крах, освобождение"},
		{Name: "Звезда", Symbol: "⭐", Description: "Надежда, вдохновение, исцеление, спокойствие"},
		{Name: "Луна", Symbol: "🌑", Description: "Иллюзии, интуиция, страхи, скрытые истины"},
		{Name: "Солнце", Symbol: "☀️", Description: "Счастье, успех, радость, жизненная сила"},
		{Name: "Суд", Symbol: "📯", Description: "Возрождение, внутренний зов, прощение, освобождение"},
		{Name: "Мир", Symbol: "🌍", Description: "Завершение, целостность, достижение, успех"},
		{Name: "Шут", Symbol: "🎭", Description: "Новое начало, спонтанность, вера в лучшее, потенциал"},
	}

	for _, card := range cards {
		_, err := db.Exec(context.Background(),
			"INSERT INTO cards (name, symbol, description) VALUES ($1, $2, $3)",
			card.Name, card.Symbol, card.Description)
		if err != nil {
			log.Printf("Ошибка при вставке карты %s: %v", card.Name, err)
		}
	}
	fmt.Println("✅ Стартовая колода загружена")
}

// CardHandler возвращает случайную карту
func cardHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	var card Card

	// SQL-запрос: выбираем случайную карту среди активных (deleted_at IS NULL)
	query := `
		SELECT id, name, symbol, description
		FROM cards
		WHERE deleted_at IS NULL
		ORDER BY RANDOM()
		LIMIT 1
	`

	err := db.QueryRow(context.Background(), query).Scan(&card.ID, &card.Name, &card.Symbol, &card.Description)

	if err != nil {
		log.Printf("Ошибка при получении карты: %v", err)
		http.Error(w, "Карта не найдена", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(card)
}

// deckHandler возвращает все активные карты
func deckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	query := `
		SELECT id, name, symbol, description 
		FROM cards 
		WHERE deleted_at IS NULL 
		ORDER BY id
	`

	rows, err := db.Query(context.Background(), query)
	if err != nil {
		log.Printf("Ошибка при получении колоды: %v", err)
		http.Error(w, "Ошибка базы данных", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var cards []Card
	for rows.Next() {
		var card Card
		err := rows.Scan(&card.ID, &card.Name, &card.Symbol, &card.Description)
		if err != nil {
			log.Printf("Ошибка при сканировании карты: %v", err)
			continue
		}
		cards = append(cards, card)
	}

	json.NewEncoder(w).Encode(cards)
}
